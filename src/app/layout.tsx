import type { Metadata } from "next";
import { Merriweather, Literata, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Audiobook Creator",
  description: "Transform your PDFs into interactive audiobooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${merriweather.variable} ${literata.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 ml-0 min-h-screen relative flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <footer className="w-full pt-6 pb-8 text-center text-sm font-medium tracking-wide">
                <span className="text-foreground/70">Developed by </span>
                <span className="text-accent font-bold">FK</span>
              </footer>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
