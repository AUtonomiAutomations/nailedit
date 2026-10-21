import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'NailedIt – הצעת מחיר אוטומטית לבעלי מקצוע', template: '%s · NailedIt' },
  description: 'הלקוח ממלא לינק, מקבל הצעת מחיר משוערת לפי התעריפים שלך – ואתה מקבל ליד מסודר. למובילים, אינסטלטורים, הנדימנים, טכנאי מזגנים, צבעים ועוד.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Secular+One&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
