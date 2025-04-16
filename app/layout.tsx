import './globals.css';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from './providers';
import { Navigation } from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Garden Logbook',
  description: 'Track and manage your garden with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-dark-bg-primary text-dark-text-primary antialiased`}>
        <NextAuthProvider>
          <div className="min-h-full">
            <Navigation />
            <main>{children}</main>
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
