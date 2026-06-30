'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  History, 
  User, 
  Flame, 
  LogOut,
  Library,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { StreakData } from '@/lib/pdf-utils';

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedStreak = localStorage.getItem('audiobook_reading_streak');
    if (savedStreak) {
      try {
        setStreak(JSON.parse(savedStreak));
      } catch (e) {
        console.error('Failed to parse streak', e);
      }
    }
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: History, label: 'History', href: '/history' },
  ];

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-xl shadow-sm text-foreground/70 hover:text-foreground transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed left-0 top-0 z-50 h-screen w-64 bg-secondary border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-accent p-2 rounded-xl">
                <Library className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">AudioBook</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-foreground/40 hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === item.href
                    ? 'bg-background text-foreground font-medium border border-border shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-xs font-bold">
              <Flame className="w-4 h-4 fill-current" />
              <span>{streak.currentStreak} Day Streak</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
