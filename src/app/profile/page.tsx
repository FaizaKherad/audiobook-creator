'use client';

import { useAuth } from '@/lib/auth-context';
import { StreakData, HistoryItem } from '@/lib/pdf-utils';
import { User, Mail, Calendar, Book, Flame, Trophy, LogOut, ChevronLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

const HISTORY_KEY = 'audiobook_reading_history';
const STREAK_KEY = 'audiobook_reading_streak';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastReadDate: '', bestStreak: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedStreak = localStorage.getItem(STREAK_KEY);
    if (savedStreak) setStreak(JSON.parse(savedStreak));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUser({ image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
        <Link href="/auth" className="text-foreground underline font-medium">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </header>

        <main className="grid gap-8 md:grid-cols-3">
          {/* User Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-secondary border border-border p-6 rounded-3xl shadow-sm text-center">
              <div className="relative inline-block mb-4 group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative block"
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-24 h-24 rounded-full border-4 border-background object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-background border-4 border-border flex items-center justify-center">
                      <User className="w-10 h-10 text-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <div className="absolute bottom-0 right-0 bg-accent p-1.5 rounded-full border-2 border-background pointer-events-none">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-foreground/70 text-sm">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="bg-secondary border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5" />
                Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-background rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-foreground/50" />
                    <span className="text-sm text-foreground/70">Books Read</span>
                  </div>
                  <span className="font-bold text-foreground">{history.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-foreground/70">Current Streak</span>
                  </div>
                  <span className="font-bold text-foreground">{streak.currentStreak} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-foreground/70">Best Streak</span>
                  </div>
                  <span className="font-bold text-foreground">{streak.bestStreak} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-4 text-foreground">Recent Activity</h3>
              <div className="grid gap-4">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.id} className="bg-secondary border border-border p-4 rounded-2xl flex items-center gap-4">
                    <div className="bg-background rounded-xl overflow-hidden flex-shrink-0 w-10 h-14 flex items-center justify-center border border-border">
                      {item.metadata.thumbnail ? (
                        <img 
                          src={item.metadata.thumbnail} 
                          alt={item.metadata.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Book className="w-5 h-5 text-foreground/70" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{item.metadata.title}</h4>
                      <p className="text-xs text-foreground/70">{new Date(item.lastRead).toLocaleDateString()} • {item.metadata.pageCount} pages</p>
                    </div>
                  </div>
                )) : (
                  <div className="bg-secondary border border-border p-8 rounded-3xl text-center">
                    <p className="text-foreground/70">No books in your history yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
