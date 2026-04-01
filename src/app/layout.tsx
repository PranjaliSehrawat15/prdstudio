import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PRD Studio - Structuring Made Easy',
  description: 'Manually create structured Product Requirements Documents and export to secure, multi-layer PDF.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="app-root">
          {children}
        </div>
      </body>
    </html>
  );
}
