'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center bg-secondary h-full overflow-y-auto p-8">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col gap-8"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page 
            key={`page_${index + 1}`} 
            pageNumber={index + 1} 
            renderAnnotationLayer={false}
            renderTextLayer={true}
            className="shadow-2xl rounded-sm overflow-hidden border border-border"
            width={Math.min(window.innerWidth - 120, 850)}
          />
        ))}
      </Document>
    </div>
  );
}
