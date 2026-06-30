'use client';

import { ThemeProvider } from 'next-themes';
import { ReadingProvider } from '@/lib/reading-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      scriptProps={{
        type: typeof window === 'undefined' ? 'text/javascript' : 'text/plain',
        suppressHydrationWarning: true,
      }}
    >
      <ReadingProvider>
        {children}
      </ReadingProvider>
    </ThemeProvider>
  );
}
