'use client';

import React, { useEffect, useState } from 'react';
import { HistoryItem } from '@/lib/pdf-utils';
import { Book, Clock, ChevronRight, Search, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReading } from '@/lib/reading-context';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { setMetadata, setFile, setParagraphs, setFullText } = useReading();

  useEffect(() => {
    const savedHistory = localStorage.getItem('audiobook_reading_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleSelect = (item: HistoryItem) => {
    setMetadata(item.metadata);
    setFile(null);
    setParagraphs([]);
    setFullText('');
    router.push('/');
  };

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('audiobook_reading_history', JSON.stringify(updated));
  };

  const filteredHistory = history.filter(item => 
    item.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.metadata.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reading History</h1>
          <p className="text-foreground/70">Manage and revisit your recently read books</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <input 
            type="text" 
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all w-full md:w-64"
          />
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="grid gap-4">
          {filteredHistory.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleSelect(item)}
              className="group bg-secondary border border-border p-5 rounded-2xl flex items-center gap-6 hover:border-foreground/20 transition-all cursor-pointer"
            >
              <div className="w-12 h-16 bg-background rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                {item.metadata.thumbnail ? (
                  <img 
                    src={item.metadata.thumbnail} 
                    alt={item.metadata.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Book className="w-6 h-6 text-foreground/50" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate mb-1">{item.metadata.title}</h3>
                <div className="flex items-center gap-4 text-sm text-foreground/70">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.metadata.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.lastRead).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => deleteItem(e, item.id)}
                  className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="p-2 bg-accent text-white rounded-lg group-hover:scale-105 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-secondary border border-border rounded-3xl">
          <Book className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No books found</h3>
          <p className="text-foreground/70">Upload a PDF to start building your history</p>
          <Link 
            href="/"
            className="inline-block mt-6 px-6 py-2 bg-accent text-white rounded-xl font-medium"
          >
            Upload Now
          </Link>
        </div>
      )}
    </div>
  );
}
