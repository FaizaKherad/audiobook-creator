export interface Word {
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface PDFMetadata {
  title: string;
  author: string;
  pageCount: number;
  thumbnail?: string;
}

export interface HistoryItem {
  id: string;
  metadata: PDFMetadata;
  lastRead: number;
}

export interface StreakData {
  currentStreak: number;
  lastReadDate: string; // ISO date string (YYYY-MM-DD)
  bestStreak: number;
}

export interface ExtractionOptions {
  skipFirstPage?: boolean;
  cleanText?: boolean;
}

export interface Paragraph {
  text: string;
  words: Word[];
  startIndex: number;
  endIndex: number;
  pageNumber: number;
}

export async function extractTextFromPDF(
  file: File, 
  options: ExtractionOptions = {},
  onProgress?: (progress: number) => void
): Promise<{ text: string; paragraphs: Paragraph[]; metadata: PDFMetadata }> {
  // Dynamic import to avoid server-side evaluation errors in Next.js
  const pdfjs = await import('pdfjs-dist/build/pdf').then(m => m.default || m);
  
  // Configure pdfjs worker to use local file copied to public
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  let metadataText = '';
  
  const startPage = options.skipFirstPage ? 2 : 1;

  for (let i = 1; i <= pdf.numPages; i++) {
    // Yield to main thread every 5 pages to keep UI responsive
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (onProgress) onProgress(Math.round((i / pdf.numPages) * 100));
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    let lastY: number | null = null;
    let lastX: number | null = null;
    let pageText = '';

    for (const item of textContent.items as any[]) {
      const x = item.transform[4];
      const y = item.transform[5];
      const height = item.height;

      if (y < 30 || y > viewport.height - 30) continue;

      if (lastY !== null) {
        if (Math.abs(y - lastY) > height * 1.5) {
          pageText += '\n\n';
        } else if (Math.abs(y - lastY) > 2) {
          pageText += '\n';
        } else if (lastX !== null && x > lastX + 2) {
          if (!item.str.startsWith(' ') && !pageText.endsWith(' ')) {
            pageText += ' ';
          }
        }
      }

      pageText += item.str;
      lastY = y;
      lastX = x + (item.width || 0);
    }
    
    if (i === 1) metadataText = pageText;
    if (i >= startPage) {
      fullText += pageText + '\n\n';
    }
  }

  fullText = fullText.trim();

  // Process into paragraphs and words efficiently
  const paragraphs: Paragraph[] = [];
  const rawParagraphs = fullText.split(/\n\n+/);
  let currentOffset = 0;
  
  // We need to map the final fullText back to page numbers.
  // Since we concatenated pageText + '\n\n', we can approximate this.
  // A better way is to process paragraphs per page.
  
  // Let's re-extract specifically for paragraphs to keep page numbers accurate
  const finalParagraphs: Paragraph[] = [];
  let globalOffset = 0;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    if (i < startPage) continue;
    
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    let pageText = '';
    let lastY: number | null = null;
    let lastX: number | null = null;

    for (const item of textContent.items as any[]) {
      const x = item.transform[4];
      const y = item.transform[5];
      const height = item.height;
      if (y < 30 || y > viewport.height - 30) continue;
      if (lastY !== null) {
        if (Math.abs(y - lastY) > height * 1.5) pageText += '\n\n';
        else if (Math.abs(y - lastY) > 2) pageText += '\n';
        else if (lastX !== null && x > lastX + 2) {
          if (!item.str.startsWith(' ') && !pageText.endsWith(' ')) pageText += ' ';
        }
      }
      pageText += item.str;
      lastY = y;
      lastX = x + (item.width || 0);
    }

    const pageParagraphs = pageText.split(/\n\n+/);
    for (const pText of pageParagraphs) {
      if (!pText.trim()) continue;
      
      const pStartIndex = globalOffset + pageText.indexOf(pText);
      const pEndIndex = pStartIndex + pText.length;
      
      const pWords: Word[] = [];
      const wordMatches = pText.matchAll(/\S+/g);
      for (const match of wordMatches) {
        const wordText = match[0];
        const wordStartInP = match.index!;
        pWords.push({
          text: wordText,
          startIndex: pStartIndex + wordStartInP,
          endIndex: pStartIndex + wordStartInP + wordText.length
        });
      }

      finalParagraphs.push({
        text: pText,
        words: pWords,
        startIndex: pStartIndex,
        endIndex: pEndIndex,
        pageNumber: i
      });
    }
    globalOffset += pageText.length + 2; // +2 for the '\n\n' we added in the first pass
  }

  // Note: the first pass was to get the 'fullText' for the reader. 
  // Let's just use the reconstructed text from finalParagraphs for consistency.
  const reconstructedFullText = finalParagraphs.map(p => p.text).join('\n\n');

  // Improved metadata extraction with heuristics (keeping existing logic)
  const metadata = await pdf.getMetadata();
  let author = (metadata.info as any)?.Author;
  let title = (metadata.info as any)?.Title;

  if (!author || author === 'Unknown' || author.trim() === '') {
    const scanText = metadataText || reconstructedFullText.substring(0, 2000);
    const authorPatterns = [
      /(?:author|written\s+by|by)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
      /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\n\s*(?:©|Copyright|All\s+rights)/i
    ];

    for (const pattern of authorPatterns) {
      const match = scanText.match(pattern);
      if (match && match[1]) {
        author = match[1].trim();
        break;
      }
    }
  }

  if (!author || author === 'Unknown' || author.trim() === '') {
    const fileName = file.name.replace(/\.pdf$/i, '');
    if (fileName.includes(' - ')) {
      const parts = fileName.split(' - ');
      author = parts[0].trim();
      if (!title || title === file.name) title = parts[1].trim();
    }
  }

  let thumbnail: string | undefined;
  try {
    const firstPage = await pdf.getPage(1);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const viewport = firstPage.getViewport({ scale: 0.3 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
      await firstPage.render({
        canvasContext: context,
        viewport: viewport,
        // @ts-ignore - Required by some versions of pdfjs types
        canvas: canvas
      } as any).promise;
      thumbnail = canvas.toDataURL('image/webp', 0.6);
    }
  } catch (e) {
    console.warn('Failed to generate thumbnail', e);
  }

  return {
    text: reconstructedFullText,
    paragraphs: finalParagraphs,
    metadata: {
      title: title || file.name,
      author: author || 'Unknown Author',
      pageCount: pdf.numPages,
      thumbnail,
    },
  };
}
