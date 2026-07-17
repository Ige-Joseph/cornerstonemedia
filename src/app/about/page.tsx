'use client';

import Footer from '@/components/layout/Footer';
import CinematicBackground from '@/components/ui/CinematicBackground';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen" style={{ background: '#060608' }}>
        {/* Hero */}
        <div className="relative overflow-hidden pt-32 pb-24 px-6">
          <div className="absolute inset-0 h-full overflow-hidden pointer-events-none">
            <CinematicBackground variant="hero" />
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 40%, rgba(6,6,8,0.2) 0%, rgba(6,6,8,0.88) 75%)' }} />
          </div>
          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body" style={{ color: '#c8901a' }}>
              // The Photographer
            </p>
            <h1 className="font-heading italic text-white leading-[0.88] tracking-[-4px] mb-4"
              style={{ fontSize: 'clamp(4rem,10vw,8rem)' }}>
              David Ige
            </h1>
            <div className="w-14 h-px mx-auto mb-5"
              style={{ background: 'linear-gradient(90deg,#c8901a,#e8b024)' }} />
            <p className="text-sm tracking-[0.3em] uppercase font-body"
              style={{ color: 'rgba(200,144,26,0.75)' }}>
              Executive Director &amp; Lead Photographer
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Portrait placeholder */}
            <div className="relative">
              <div className="aspect-[4/5] liquid-glass rounded-[1.5rem] flex flex-col items-center justify-center"
                style={{ border: '1px solid rgba(200,144,26,0.12)' }}>
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-heading italic font-bold mb-5"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  DI
                </div>
                <p className="text-xs font-body tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  [ Replace with your photo ]
                </p>
              </div>
              {/* Corner accents */}
              {([['top-0 left-0','t','l'],['top-0 right-0','t','r'],['bottom-0 left-0','b','l'],['bottom-0 right-0','b','r']] as [string,string,string][]).map(([pos,v,h],i) => (
                <div key={i} className={`absolute ${pos} w-10 h-10 pointer-events-none`} style={{
                  borderTop:    v==='t' ? '1.5px solid #c8901a' : undefined,
                  borderBottom: v==='b' ? '1.5px solid #c8901a' : undefined,
                  borderLeft:   h==='l' ? '1.5px solid #c8901a' : undefined,
                  borderRight:  h==='r' ? '1.5px solid #c8901a' : undefined,
                }} />
              ))}
            </div>

            {/* Bio text */}
            <div className="pt-4">
              <h2 className="text-3xl font-heading italic text-white leading-tight mb-5">
                Capturing the Soul of Every Moment
              </h2>
              <div className="w-12 h-px mb-7" style={{ background: 'linear-gradient(90deg,#c8901a,#e8b024)' }} />
              <div className="space-y-4 text-sm font-body font-light leading-relaxed"
                style={{ color: 'rgba(232,232,232,0.5)' }}>
                <p>With over eight years behind the lens, David Ige has built Corner Stone Media into one of the most sought-after photography studios in the region, serving clients across Lagos, Abuja, and beyond.</p>
                <p>David&apos;s approach is rooted in authenticity — the finest photographs are discovered, not staged. By immersing himself in each client&apos;s world, he reveals the genuine emotions that make every story unique.</p>
                <p>His black-and-gold visual philosophy reflects his dedication to elegance, precision, and the timeless quality he brings to every frame.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-10 pt-8"
                style={{ borderTop: '1px solid rgba(200,144,26,0.1)' }}>
                {[{v:'8+',l:'Years'},{v:'500+',l:'Sessions'},{v:'100%',l:'Satisfaction'}].map(({v,l}) => (
                  <div key={l} className="text-center">
                    <div className="text-3xl font-heading italic mb-1" style={{ color: '#c8901a' }}>{v}</div>
                    <div className="text-[10px] tracking-widest uppercase font-body"
                      style={{ color: 'rgba(232,232,232,0.35)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="liquid-glass rounded-[1.5rem] text-center p-12 mt-16"
            style={{ border: '1px solid rgba(200,144,26,0.1)' }}>
            <h3 className="text-3xl font-heading italic text-white mb-3">Ready to work together?</h3>
            <p className="text-sm font-body mb-7" style={{ color: 'rgba(232,232,232,0.45)' }}>
              Let&apos;s create something extraordinary for your next event.
            </p>
            <Link href="/#booking"
              className="inline-flex items-center gap-2 px-10 py-4 text-sm font-semibold tracking-widest uppercase font-body rounded-full"
              style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
              Book a Session →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
