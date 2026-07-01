'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
  currentPage: number;
  onPageChange?: (page: number) => void;
}

export function PDFViewer({ file, currentPage, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const isInternalUpdate = useRef(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    // Initialize IntersectionObserver to track which page is in view
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries.length === 0) return;

        // Find the entry with the highest intersection ratio (the most visible page)
        let mostVisibleEntry = entries[0];
        for (let i = 1; i < entries.length; i++) {
          if (entries[i].intersectionRatio > mostVisibleEntry.intersectionRatio) {
            mostVisibleEntry = entries[i];
          }
        }

        if (mostVisibleEntry.isIntersecting) {
          const pageId = mostVisibleEntry.target.id;
          if (pageId && pageId.startsWith('page_')) {
            const pageNumber = parseInt(pageId.replace('page_', ''), 10);
            // Only trigger if the most visible page is actually visible enough
            if (mostVisibleEntry.intersectionRatio > 0.1) {
              console.log(`PDFViewer: Page ${pageNumber} is most visible (${Math.round(mostVisibleEntry.intersectionRatio * 100)}%)`);
              if (onPageChange) {
                isInternalUpdate.current = true;
                onPageChange(pageNumber);
              }
            }
          }
        }
      },
      { threshold: [0, 0.1, 0.2, 0.5] } // Multiple thresholds for smoother tracking
    );

    return () => observer.current?.disconnect();
  }, [onPageChange]);

  useEffect(() => {
    // Observe all page containers
    const pageElements = document.querySelectorAll('[id^="page_"]');
    pageElements.forEach((el) => observer.current?.observe(el));
  }, [numPages]);

  useEffect(() => {
    if (currentPage && numPages > 0 && !isInternalUpdate.current) {
      const element = document.getElementById(`page_${currentPage}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    isInternalUpdate.current = false;
  }, [currentPage, numPages]);

  const visibleRange = 3;
  const renderedPages = Array.from(new Array(numPages), (_, index) => {
    const pageNum = index + 1;
    const isVisible = Math.abs(pageNum - currentPage) <= visibleRange;
    return { pageNum, isVisible };
  });

  return (
    <div className="flex flex-col items-center bg-secondary h-full overflow-y-auto p-8">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col gap-8"
      >
        {renderedPages.map(({ pageNum, isVisible }) => (
          <div 
            key={`page_container_${pageNum}`} 
            id={`page_${pageNum}`} 
            style={{ 
              minHeight: '800px', // Approximate height to maintain scrollbar consistency
              visibility: isVisible ? 'visible' : 'hidden' 
            }}
          >
            {isVisible && (
              <Page 
                pageNumber={pageNum} 
                renderAnnotationLayer={false}
                renderTextLayer={true}
                className="shadow-2xl rounded-sm overflow-hidden border border-border"
                width={Math.min(window.innerWidth - 120, 850)}
              />
            )}
          </div>
        ))}
      </Document>
    </div>
  );
}
