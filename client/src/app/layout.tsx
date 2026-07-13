import type { Metadata } from 'next';
import { Noto_Nastaliq_Urdu, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import { OfflineProvider } from '@/providers/OfflineProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import OfflineBanner from '@/components/OfflineBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-nastaliq',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zynq',
  description: 'AI-powered inventory management PWA for Pakistani small businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoNastaliq.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground min-h-screen antialiased flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <OfflineProvider>
              <OfflineBanner />
              {children}
            </OfflineProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
