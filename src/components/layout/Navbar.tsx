'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const navLinks = [
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Services', href: '/#services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#booking' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-obsidian-900/95 backdrop-blur-md border-b border-gold-600/10 shadow-lg shadow-black/30'
            : 'bg-transparent'
        } light:${scrolled ? 'bg-white/95 shadow-md border-b border-gold-400/20' : 'bg-transparent'}`}
        style={{
          backgroundColor: scrolled
            ? theme === 'dark' ? 'rgba(10,10,10,0.95)' : 'rgba(245,240,232,0.95)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(200,144,26,0.12)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" onClick={closeMenu}>
            <Image
              src="/icons/logo.svg"
              alt="Corner Stone Media"
              width={200}
              height={52}
              priority
              className="h-11 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-widest uppercase transition-colors duration-200"
                style={{ color: theme === 'dark' ? 'rgba(232,232,232,0.7)' : 'rgba(26,26,26,0.7)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c8901a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme === 'dark' ? 'rgba(232,232,232,0.7)' : 'rgba(26,26,26,0.7)')}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#booking"
              className="text-sm font-semibold tracking-wider uppercase px-6 py-2.5 border border-gold-600 text-gold-400 hover:bg-gold-600 hover:text-obsidian-900 transition-all duration-300"
              style={{
                borderColor: '#c8901a',
                color: '#c8901a',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#c8901a';
                (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLAnchorElement).style.color = '#c8901a';
              }}
            >
              Book Now
            </Link>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-gold-600/10"
              style={{ color: '#c8901a' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden w-10 h-10 flex items-center justify-center"
              style={{ color: '#c8901a' }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 pt-20 md:hidden"
            style={{
              background: theme === 'dark' ? 'rgba(10,10,10,0.98)' : 'rgba(245,240,232,0.98)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <nav className="flex flex-col items-center justify-center h-full gap-10 pb-20">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="text-2xl font-light tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-cormorant)', color: theme === 'dark' ? '#e8e8e8' : '#1a1a1a' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.07 }}
              >
                <Link
                  href="/#booking"
                  onClick={closeMenu}
                  className="text-base font-semibold tracking-widest uppercase px-10 py-3 border"
                  style={{ borderColor: '#c8901a', color: '#c8901a' }}
                >
                  Book Now
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
