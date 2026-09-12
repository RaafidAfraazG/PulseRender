/**
 * PulseRender - Root Layout
 *
 * Server Component. Sets global metadata, imports the design-system CSS,
 * and wraps the app in the DashboardProvider client boundary.
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'PulseRender - High-Performance Real-Time Data Visualization',
    template: '%s | PulseRender',
  },
  description:
    'PulseRender is a high-performance real-time data visualization dashboard ' +
    'demonstrating 10,000+ data points rendered at 60 FPS with Canvas + SVG hybrid rendering.',
  keywords: [
    'data visualization',
    'real-time',
    'high performance',
    'canvas rendering',
    'React',
    'Next.js',
  ],
  authors: [{ name: 'PulseRender' }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1117',
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
