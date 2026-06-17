'use client';

import { HistoryItem } from '@/lib/pdf-utils';
import { Book, Clock, ChevronRight } from 'lucide-react';

interface ReadingHistoryProps {
  history: HistoryItem[];
  onItemSelect: (item: HistoryItem) => void;
}

export function ReadingHistory({ history, onItemSelect }: ReadingHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Clock className="w-5 h-5 text-foreground/40" />
        <h2 className="text-lg font-bold text-foreground">Recently Read</h2>
      </div>
      <div className="grid gap-3">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item)}
            className="flex items-center gap-4 p-4 bg-secondary border border-border rounded-2xl hover:border-accent/40 transition-all text-left group shadow-sm hover:shadow-md"
          >
            <div className="bg-background rounded-xl border border-border transition-colors overflow-hidden flex-shrink-0 w-12 h-16 flex items-center justify-center">
              {item.metadata.thumbnail ? (
                <img 
                  src={item.metadata.thumbnail} 
                  alt={item.metadata.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Book className="w-6 h-6 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">
                {item.metadata.title}
              </h3>
              <p className="text-sm text-foreground/60 truncate">
                {item.metadata.author} • {item.metadata.pageCount} pages
              </p>
            </div>
            <div className="text-xs text-foreground/40 mr-2 hidden sm:block">
              {new Date(item.lastRead).toLocaleDateString()}
            </div>
            <ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-foreground/60 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
