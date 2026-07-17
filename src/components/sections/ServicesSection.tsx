'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Camera, Film, Star, Users, Briefcase, Award, ArrowUpRight } from 'lucide-react';
import CinematicBackground from '@/components/ui/CinematicBackground';

const services = [
  { icon: Camera,    title: 'Portrait Sessions',  tags: ['Individual','Family','Corporate'],
    description: 'Intimate, artfully crafted portraits that reveal character and soul. Studio and outdoor lifestyle sessions.' },
  { icon: Film,      title: 'Videography',         tags: ['Ceremonies','Promotions','Reels'],
    description: 'Cinematic storytelling for your most important moments — ceremonies, brand promos, full event coverage.' },
  { icon: Star,      title: 'Wedding Coverage',    tags: ['Engagements','Full Day','Highlights'],
    description: 'From the quiet before-moments to the final dance, we document your love story with elegance and care.' },
  { icon: Award,     title: 'Graduations',         tags: ['Convocations','Portraits','Celebrations'],
    description: 'Mark your academic milestone with powerful imagery — the pride, joy, and triumph of your achievement.' },
  { icon: Users,     title: 'Events & Parties',    tags: ['Birthdays','Galas','Anniversaries'],
    description: 'Birthdays, gala dinners, anniversaries — every celebration captured with atmosphere and energy.' },
  { icon: Briefcase, title: 'Corporate & Brand',   tags: ['Branding','Products','Executives'],
    description: 'Elevate your brand presence with office environments, product photography, and executive portraits.' },
];

export default function ServicesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.06 });

  return (
    <section id="services" className="section-padding relative overflow-hidden" style={{ background: '#060608', position: 'relative', zIndex: 1 }}>
      <CinematicBackground variant="services" />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        opacity: 0.018,
        backgroundImage: 'linear-gradient(rgba(200,144,26,1) 1px,transparent 1px),linear-gradient(90deg,rgba(200,144,26,1) 1px,transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(6,6,8,0.1) 0%, rgba(6,6,8,0.85) 100%)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body" style={{ color: '#c8901a' }}>
            // What We Offer
          </p>
          <h2 className="font-heading italic text-white leading-[0.9] tracking-[-3px] mb-4"
            style={{ fontSize: 'clamp(3rem,7vw,5.5rem)' }}>
            Production<br />evolved
          </h2>
          <div className="gold-divider" />
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.title}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.09, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="liquid-glass rounded-[1.25rem] p-6 flex flex-col min-h-[340px] group relative overflow-hidden transition-all duration-300"
                style={{ border: '1px solid rgba(200,144,26,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,144,26,0.28)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,144,26,0.07)'; }}>

                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-auto">
                  <div className="liquid-glass rounded-[0.75rem] w-11 h-11 flex items-center justify-center flex-shrink-0"
                    style={{ color: '#c8901a' }}>
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[68%]">
                    {service.tags.map(tag => (
                      <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] font-body whitespace-nowrap"
                        style={{ color: 'rgba(232,232,232,0.7)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom */}
                <div className="mt-8">
                  <h3 className="font-heading italic text-white leading-none tracking-[-1px] mb-3"
                    style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
                    {service.title}
                  </h3>
                  <p className="text-sm font-body font-light leading-snug max-w-[32ch]"
                    style={{ color: 'rgba(232,232,232,0.5)' }}>
                    {service.description}
                  </p>
                </div>

                {/* Hover bottom line */}
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(90deg,transparent,#c8901a,transparent)' }} />
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.72, duration: 0.6 }}
          className="text-center mt-14">
          <a href="/#booking"
            className="inline-flex items-center gap-2 text-sm font-semibold font-body tracking-wider uppercase px-8 py-4 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
            Book Your Session <ArrowUpRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
