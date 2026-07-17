'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// ── Config — update these values ──────────────────────────────────────────────
// Read from env — set NEXT_PUBLIC_WHATSAPP_NUMBER in your .env.local
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2348000000000';
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello! I found Corner Stone Media and I'm interested in booking a photography session. Could you tell me more about your services and availability?",
);
// ─────────────────────────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed]     = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show tooltip automatically after 4 seconds on first visit
    const seen = sessionStorage.getItem('wa-tooltip-seen');
    if (!seen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('wa-tooltip-seen', '1');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hide on admin pages
  if (!mounted) return null;
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return null;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      style={{ isolation: 'isolate' }}
    >
      {/* Tooltip / chat bubble */}
      <AnimatePresence>
        {showTooltip && !dismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={  { opacity: 0, scale: 0.85, y: 10  }}
            transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
            className="relative max-w-[240px] p-4 rounded-2xl shadow-2xl"
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(200,144,26,0.2)',
              transformOrigin: 'bottom right',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full"
              style={{ color: 'rgba(232,232,232,0.4)', background: 'rgba(255,255,255,0.06)' }}
              aria-label="Close"
            >
              <X size={10} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#25D366' }}>
                <WhatsAppIcon size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold font-body" style={{ color: '#e8e8e8' }}>David Ige</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#25D366' }} />
                  <p className="text-[10px] font-body" style={{ color: 'rgba(232,232,232,0.5)' }}>Typically replies in minutes</p>
                </div>
              </div>
            </div>

            <p className="text-xs font-body leading-relaxed mb-3" style={{ color: 'rgba(232,232,232,0.7)' }}>
              Hi there! 👋 Ready to capture your next milestone? Chat with me directly on WhatsApp.
            </p>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowTooltip(false)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-full text-xs font-semibold font-body transition-opacity hover:opacity-90"
              style={{ background: '#25D366', color: '#fff' }}
            >
              <WhatsAppIcon size={14} />
              Start Chat
            </a>

            {/* Bubble tail */}
            <div
              className="absolute -bottom-2 right-5"
              style={{
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(200,144,26,0.2)',
              }}
            />
            <div
              className="absolute -bottom-[7px] right-[21px]"
              style={{
                width: 0, height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '7px solid #1a1a1a',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main WhatsApp FAB */}
      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onClick={() => setShowTooltip(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.4, ease: [0.22,1,0.36,1] }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => { if (!dismissed) setShowTooltip(true); }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <WhatsAppIcon size={28} />
      </motion.a>

      {/* Pulse ring — draws attention without being annoying */}
      <motion.div
        className="absolute bottom-0 right-0 w-14 h-14 rounded-full pointer-events-none"
        style={{ border: '2px solid rgba(37,211,102,0.4)' }}
        animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
      />
    </div>
  );
}
