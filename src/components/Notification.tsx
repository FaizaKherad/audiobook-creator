'use client';

import React, { useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface NotificationProps {
  message: string | null;
  onClose: () => void;
}

export function Notification({ message, onClose }: NotificationProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-background border border-border shadow-2xl rounded-2xl p-4 max-w-md flex items-start gap-3">
        <div className="bg-accent/10 p-2 rounded-lg">
          <Info className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-foreground/50" />
        </button>
      </div>
    </div>
  );
}
