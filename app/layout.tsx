import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OG Scale',
  description: 'Dynamic OpenGraph images for GitHub repos, commits, issues and pull requests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}