import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Corner Stone Media',
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#060608' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(200,144,26,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        {/* Big 404 */}
        <p
          className="font-heading italic leading-none mb-2 select-none"
          style={{
            fontSize: 'clamp(7rem,20vw,14rem)',
            color: 'rgba(200,144,26,0.12)',
            letterSpacing: '-6px',
          }}
        >
          404
        </p>

        {/* Gold divider */}
        <div
          className="mx-auto mb-6"
          style={{
            width: 56,
            height: '1.5px',
            background: 'linear-gradient(90deg, #c8901a, #e8b024)',
          }}
        />

        <h1
          className="font-heading italic text-white mb-4"
          style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-1px' }}
        >
          Frame Not Found
        </h1>

        <p
          className="text-sm font-body font-light max-w-sm mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(232,232,232,0.45)' }}
        >
          This page doesn&apos;t exist — but every great shot starts with finding the right
          angle. Let&apos;s get you back on frame.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="px-8 py-3 text-sm font-semibold font-body tracking-wider uppercase rounded-full"
            style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}
          >
            Back to Home
          </Link>
          <Link
            href="/gallery"
            className="px-8 py-3 text-sm font-medium font-body tracking-wider uppercase rounded-full border"
            style={{ borderColor: 'rgba(200,144,26,0.3)', color: 'rgba(232,232,232,0.7)' }}
          >
            View Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
