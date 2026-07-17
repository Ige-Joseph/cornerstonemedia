import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photography Gallery | Corner Stone Media',
  description:
    'Browse our portfolio of weddings, portraits, corporate events, graduations, and more. Premium photography by David Ige.',
  openGraph: {
    title: 'Gallery | Corner Stone Media',
    description: 'Premium photography portfolio — weddings, portraits, events and more.',
    type: 'website',
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
