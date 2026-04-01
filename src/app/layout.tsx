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
      <body>
        <div id="app-root">
          {children}
        </div>
      </body>
    </html>
  );
}
