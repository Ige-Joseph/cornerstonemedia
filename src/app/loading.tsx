export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#060608' }}
    >
      {/* Animated lens aperture */}
      <div className="flex flex-col items-center gap-5">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle
            cx="28" cy="28" r="22"
            stroke="rgba(200,144,26,0.2)"
            strokeWidth="1.5"
          />
          <circle
            cx="28" cy="28" r="14"
            stroke="rgba(200,144,26,0.35)"
            strokeWidth="1.5"
            strokeDasharray="22 66"
            strokeLinecap="round"
            style={{ animation: 'spin 1.4s linear infinite', transformOrigin: '28px 28px' }}
          />
          <circle cx="28" cy="28" r="4" fill="rgba(200,144,26,0.6)" />
        </svg>
        <p
          className="text-xs tracking-[0.3em] uppercase font-body"
          style={{ color: 'rgba(200,144,26,0.45)' }}
        >
          Loading
        </p>
      </div>

      <style>{`
        @keyframes spin { to { stroke-dashoffset: -88; } }
      `}</style>
    </div>
  );
}
