import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navigation } from './components/Navigation';
import type { Metadata } from "next";
import { Toaster } from "sonner";
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Garden Logbook',
  description: 'Track and manage your garden growth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-dark-bg-primary text-dark-text-primary antialiased`}>
        <Providers>
          <div className="min-h-full flex flex-col">
            <div className="flex-none relative z-50">
              <Navigation />
            </div>
            <main className="flex-1 relative z-0">{children}</main>
          </div>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
