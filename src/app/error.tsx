'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in dev — swap for a real error service (Sentry, etc.) in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#060608', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'Barlow, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(200,144,26,0.06) 0%, transparent 70%)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 80, color: 'rgba(200,144,26,0.15)', letterSpacing: -4, lineHeight: 1, marginBottom: 16 }}>
              Oops
            </p>
            <div style={{ width: 56, height: 1.5, background: 'linear-gradient(90deg,#c8901a,#e8b024)', margin: '0 auto 24px' }} />
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#e8e8e8', fontSize: 28, marginBottom: 12 }}>
              Something went wrong
            </h1>
            <p style={{ color: 'rgba(232,232,232,0.45)', fontSize: 14, maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.7 }}>
              An unexpected error occurred. If this keeps happening, please contact us.
            </p>

            {process.env.NODE_ENV === 'development' && error?.message && (
              <pre style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', fontSize: 11, padding: '12px 16px', borderRadius: 8,
                maxWidth: 500, margin: '0 auto 24px', textAlign: 'left', overflowX: 'auto',
              }}>
                {error.message}
                {error.digest ? `\nDigest: ${error.digest}` : ''}
              </pre>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 28px', fontSize: 13, fontFamily: 'Barlow, sans-serif',
                  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608',
                  border: 'none', borderRadius: 9999, cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 28px', fontSize: 13, fontFamily: 'Barlow, sans-serif',
                  fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'transparent', color: 'rgba(232,232,232,0.65)',
                  border: '1px solid rgba(200,144,26,0.3)', borderRadius: 9999,
                  textDecoration: 'none', display: 'inline-block',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
