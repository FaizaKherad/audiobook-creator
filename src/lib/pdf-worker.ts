self.onmessage = async function(e) {
  const { file, options } = e.data;
  
  try {
    const pdfjsModule = await import('pdfjs-dist');
    const pdfjs = (pdfjsModule as any).default || pdfjsModule;
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const startPage = options.skipFirstPage ? 2 : 1;
    let globalOffset = 0;
    const finalParagraphs = [];
    let metadataText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      let pageText = '';
      let lastY = null;
      let lastX = null;

      for (const item of textContent.items) {
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

      if (i === 1) metadataText = pageText;
      if (i >= startPage) {
        const pageParagraphs = pageText.split('\n\n+');
        for (const pText of pageParagraphs) {
          if (!pText.trim()) continue;
          
          const pStartIndex = globalOffset + pageText.indexOf(pText);
          const pEndIndex = pStartIndex + pText.length;
          
          const pWords = [];
          const wordMatches = pText.matchAll(/\S+/g);
          for (const match of wordMatches) {
            pWords.push({
              text: match[0],
              startIndex: pStartIndex + match.index,
              endIndex: pStartIndex + match.index + match[0].length
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
        globalOffset += pageText.length + 2;
      }
    }

    const reconstructedFullText = finalParagraphs.map(p => p.text).join('\n\n');
    const metadata = await pdf.getMetadata();
    
    self.postMessage({
      text: reconstructedFullText,
      paragraphs: finalParagraphs,
      metadata: {
        title: (metadata.info as any)?.Title || 'Unknown Title',
        author: (metadata.info as any)?.Author || 'Unknown Author',
        pageCount: pdf.numPages,
      }
    });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
