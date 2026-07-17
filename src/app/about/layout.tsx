import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About David Ige | Corner Stone Media',
  description:
    'Meet David Ige, Executive Director and lead photographer at Corner Stone Media — 8+ years of capturing life\'s most precious moments.',
  openGraph: {
    title: 'About David Ige | Corner Stone Media',
    description: 'Executive Director & Lead Photographer at Corner Stone Media, Lagos.',
    type: 'profile',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
