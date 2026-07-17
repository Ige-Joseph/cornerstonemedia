'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const SOCIAL = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook,  href: '#', label: 'Facebook' },
  { icon: Twitter,   href: '#', label: 'X / Twitter' },
];
const LINKS = [
  { label: 'Gallery',         href: '/gallery' },
  { label: 'Services',        href: '/#services' },
  { label: 'Book a Session',  href: '/#booking' },
  { label: 'About David Ige', href: '/about' },
  { label: 'Admin Login',     href: '/admin/login' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden"
      style={{ background: '#040406', borderTop: '1px solid rgba(200,144,26,0.08)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(200,144,26,0.4),transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div>
            <Image src="/icons/logo.svg" alt="Corner Stone Media" width={180} height={48} className="h-10 w-auto mb-5" />
            <p className="text-sm font-body font-light leading-relaxed mb-6 max-w-[260px]"
              style={{ color: 'rgba(232,232,232,0.32)' }}>
              Capturing life&apos;s most precious moments with artistry, elegance, and a timeless perspective.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                  className="liquid-glass w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5"
                  style={{ color: '#c8901a' }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-5 font-body"
              style={{ color: '#c8901a' }}>Quick Links</h3>
            <ul className="space-y-3">
              {LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm font-body transition-colors hover:text-white/70"
                    style={{ color: 'rgba(232,232,232,0.32)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-5 font-body"
              style={{ color: '#c8901a' }}>Get in Touch</h3>
            <ul className="space-y-3">
              {[
                { icon: Mail,   text: 'david@cornerstonemedia.com' },
                { icon: Phone,  text: '+234 XXX XXX XXXX' },
                { icon: MapPin, text: 'Lagos, Nigeria' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm font-body"
                  style={{ color: 'rgba(232,232,232,0.32)' }}>
                  <Icon size={13} style={{ color: '#c8901a', flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(200,144,26,0.07)' }}>
          <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.22)' }}>
            &copy; {new Date().getFullYear()} Corner Stone Media. All rights reserved.
          </p>
          <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.22)' }}>
            Crafted for exceptional storytelling.
          </p>
        </div>
      </div>
    </footer>
  );
}
