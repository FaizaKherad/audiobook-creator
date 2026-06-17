'use client';

import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto p-6 md:p-12 border-2 border-dashed border-border rounded-3xl bg-secondary transition-all hover:border-accent/40 shadow-sm">
      <div className="bg-background p-4 rounded-full mb-4 md:mb-6 border border-border">
        <Upload className="w-6 h-6 md:w-8 md:h-8 text-accent" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Upload your PDF</h2>
      <p className="text-foreground/70 text-center mb-8">
        Select a book in PDF format to start listening.
      </p>
      
      <label className={`
        relative flex items-center justify-center px-8 py-3.5 rounded-xl font-bold cursor-pointer transition-all shadow-sm
        ${isLoading ? 'bg-secondary cursor-not-allowed text-foreground/50' : 'bg-accent text-white hover:opacity-90 active:scale-95'}
      `}>
        {isLoading ? 'Processing...' : 'Choose PDF'}
        <input 
          type="file" 
          className="hidden" 
          accept="application/pdf" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
    </div>
  );
}
