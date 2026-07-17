import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Corner Stone Media | Photography & Videography',
  description: "Capturing life's most precious moments with artistry and elegance. Professional photography and videography by David Ige.",
  keywords: 'photography, videography, weddings, portraits, events, Lagos, Nigeria',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Corner Stone Media', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/logo.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#060608' },
    { media: '(prefers-color-scheme: light)', color: '#f2ede4' },
  ],
  width: 'device-width', initialScale: 1, maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#c8901a" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#16161c',
                color: '#e8e8e8',
                border: '1px solid rgba(200,144,26,0.25)',
                fontFamily: 'Barlow, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#c8901a', secondary: '#060608' } },
            }}
          />
          <WhatsAppButton />
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
        }}/>
      </body>
    </html>
  );
}
