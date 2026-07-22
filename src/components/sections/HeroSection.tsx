'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Play } from 'lucide-react';
import CinematicBackground from '@/components/ui/CinematicBackground';

/* ── Word-by-word blur-in headline ─────────────────────────── */
function BlurHeadline({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.04em' }}>
      {text.split(' ').map((word, i) => (
        <motion.span key={i}
          initial={{ filter: 'blur(14px)', opacity: 0, y: 42 }}
          animate={visible ? {
            filter: ['blur(14px)', 'blur(4px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y: [42, -4, 0],
          } : {}}
          transition={{ duration: 0.8, delay: i * 0.1, times: [0, 0.5, 1], ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.26em' }}>
          {word}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Infinite auto-scroll partners ticker ───────────────────── */
const PARTNERS = ['Weddings', 'Portraits', 'Events', 'Corporate', 'Film', 'Graduations'];

function PartnersTicker() {
  // Duplicate the list so the loop is seamless
  const items = [...PARTNERS, ...PARTNERS];
  return (
    <div className="w-full overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%)' }}>
      <div className="flex partners-ticker" style={{ width: 'max-content' }}>
        {items.map((label, i) => (
          <span key={i} className="flex items-center gap-0 select-none">
            <span className="text-xl md:text-2xl font-heading italic tracking-tight whitespace-nowrap px-6 md:px-10"
              style={{ color: 'rgba(232,232,232,0.45)' }}>
              {label}
            </span>
            <span style={{ color: 'rgba(200,144,26,0.3)', fontSize: 6 }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Home',     href: '/' },
  { label: 'Gallery',  href: '/gallery' },
  { label: 'Services', href: '/#services' },
  { label: 'About',    href: '/about' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          padding: scrolled ? '10px 32px' : '18px 32px',
          background: scrolled ? 'rgba(6,6,8,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(200,144,26,0.08)' : 'none',
        }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Image src="/icons/logo.svg" alt="Corner Stone Media" width={180} height={48} className="h-10 w-auto" priority />
          </Link>

          {/* Desktop nav pill */}
          <nav className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-2 py-2">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="px-4 py-2 text-sm font-medium rounded-full hover:bg-white/5 transition-colors font-body"
                style={{ color: 'rgba(232,232,232,0.8)' }}>
                {l.label}
              </Link>
            ))}
            <Link href="/#booking"
              className="ml-1 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-black bg-white rounded-full whitespace-nowrap hover:bg-white/90 transition-colors">
              Book a Session <ArrowUpRight size={14} />
            </Link>
          </nav>

          {/* Right: Admin shortcut + mobile burger */}
          <div className="flex items-center gap-3">
            <Link href="/admin/login"
              className="hidden md:flex items-center gap-1.5 liquid-glass px-3 py-2 rounded-full text-xs font-body transition-opacity hover:opacity-80"
              style={{ color: 'rgba(200,144,26,0.7)' }}>
              🔒 Admin
            </Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden liquid-glass w-11 h-11 rounded-full flex items-center justify-center flex-col gap-1.5 px-3"
              aria-label="Menu">
              <span className={`block h-px w-5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-px w-5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 md:hidden"
          style={{ background: 'rgba(6,6,8,0.97)', backdropFilter: 'blur(24px)' }}>
          {[...NAV_LINKS, { label: 'Admin Login', href: '/admin/login' }, { label: 'Book a Session', href: '/#booking' }].map((l, i) => (
            <motion.div key={l.href}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Link href={l.href} onClick={() => setMenuOpen(false)}
                className="text-3xl font-heading italic text-white transition-colors hover:opacity-70">
                {l.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}

/* ── Hero Section ───────────────────────────────────────────── */
export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Keep the hero readable through most of its scroll range, then let all
  // foreground content leave together close to the section boundary.
  const contentY       = useTransform(scrollYProgress, [0, 0.72, 1], ['0%', '0%', '5%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72, 0.96], [1, 1, 0]);

  const fi = (delay: number) => ({
    initial: { filter: 'blur(10px)', opacity: 0, y: 22 },
    animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
    transition: { delay, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <>
      <Navbar />
      {/* position:relative + isolation:isolate + z-index:0 keeps this section
           stacking context below ServicesSection (which has z-index:auto/higher).
           overflow:hidden clips any parallax movement at the section boundary. */}
      <section
        ref={ref}
        className="relative min-h-[max(100svh,760px)] flex flex-col overflow-hidden"
        style={{ background: '#060608', isolation: 'isolate', zIndex: 0 }}>

        {/* 3D cinematic canvas */}
        <CinematicBackground variant="hero" />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 44%, transparent 0%, rgba(6,6,8,0.45) 65%, rgba(6,6,8,0.92) 100%)' }} />

        {/* Main content */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 flex flex-col flex-1 items-center justify-center pt-28 pb-6 px-6 text-center">

          {/* Badge */}
          <motion.div {...fi(0.3)} className="mb-8">
            <div className="liquid-glass rounded-full inline-flex items-center gap-2 px-2 py-2">
              <span className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full font-body">New</span>
              <span className="text-sm text-white/80 pr-3 font-body">2025 Sessions Now Open — Limited Availability</span>
            </div>
          </motion.div>

          {/* Headline */}
          <BlurHeadline
            text="Every Frame a Timeless Work of Art"
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.88] max-w-3xl tracking-[-3px] mb-6"
          />

          {/* Subheading */}
          <motion.p {...fi(0.88)}
            className="text-sm md:text-base text-white/55 max-w-xl font-body font-light leading-relaxed mb-8">
            Premium photography &amp; videography for weddings, portraits, corporate events, and every milestone that deserves to live forever.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fi(1.08)} className="flex items-center gap-5 mb-12">
            <Link href="/#booking"
              className="liquid-glass-strong rounded-full flex items-center gap-2 px-6 py-3 text-sm font-semibold font-body text-white transition-colors hover:bg-white/10">
              Book a Session <ArrowUpRight size={16} />
            </Link>
            <Link href="/gallery"
              className="flex items-center gap-3 text-sm text-white/65 hover:text-white transition-colors font-body">
              <span className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(200,144,26,0.15)', border: '1px solid rgba(200,144,26,0.3)' }}>
                <Play size={13} className="ml-0.5" style={{ color: '#e8b024', fill: '#e8b024' }} />
              </span>
              View Gallery
            </Link>
          </motion.div>

          {/* Stat cards */}
          <motion.div {...fi(1.28)} className="flex items-stretch gap-4 flex-wrap justify-center">
            {[
              { icon: <ClockSVG />, value: '500+', label: 'Sessions Delivered' },
              { icon: <GlobeSVG />, value: 'Photo + Film', label: 'Complete Storytelling' },
            ].map(s => (
              <div key={s.label} className="liquid-glass rounded-[1.25rem] p-5 flex flex-col gap-3" style={{ minWidth: 190 }}>
                <div className="w-7 h-7 self-center text-white/70">{s.icon}</div>
                <div>
                  <div className="text-[2.5rem] font-heading italic text-white leading-none tracking-[-1px]">{s.value}</div>
                  <div className="text-xs text-white/45 font-body font-light mt-1.5">{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Partners — trusted chip + auto-scrolling ticker */}
        <motion.div
          style={{ opacity: contentOpacity }}
          initial={{ y: 10 }} animate={{ y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="relative z-10 flex flex-col items-center gap-4 pb-12 mt-auto">

          {/* Chip label */}
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium font-body text-white/45">
            Trusted by clients across Lagos, Abuja &amp; beyond
          </div>

          {/* Scrolling ticker — works on all screen sizes */}
          <PartnersTicker />
        </motion.div>

        {/* Bottom section-transition fade — masks any content that
            would otherwise peek above the services section edge */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '72px',
            zIndex: 2,
            background: 'linear-gradient(180deg, transparent 0%, #060608 100%)',
          }}
        />
      </section>
    </>
  );
}

function ClockSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  );
}
function GlobeSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
    </svg>
  );
}
