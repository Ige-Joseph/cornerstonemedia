'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Fallback data shown while API loads or if backend is unreachable
const FALLBACK = [
  { id:'1', clientName:'Adaeze & Emeka Okonkwo', service:'Wedding Photography', initials:'AO',
    quote:'David captured our wedding day beyond our wildest expectations. Every emotion, every laugh — preserved forever. We cry happy tears every time we look at the album.' },
  { id:'2', clientName:'TechBridge Nigeria', service:'Corporate Event', initials:'TB',
    quote:'Our annual conference looked absolutely stunning. Professional, timely, impeccable quality. Corner Stone Media is now our go-to for all corporate shoots.' },
  { id:'3', clientName:'Chioma Adeleke', service:'Graduation Portrait', initials:'CA',
    quote:'I wanted my graduation photos to feel regal and timeless. David delivered exactly that. My family was moved to tears — a truly gifted storyteller with a camera.' },
];

interface Testimonial {
  id: string;
  clientName: string;
  service: string;
  initials: string;
  quote: string;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    axios.get(`${API}/testimonials`, { timeout: 5000 })
      .then(res => { if (res.data?.length > 0) setTestimonials(res.data); })
      .catch(() => { /* stay on fallback silently */ });
  }, []);

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#07070a' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body" style={{ color: '#c8901a' }}>
            // Client Stories
          </p>
          <h2 className="font-heading italic text-white leading-[0.9] tracking-[-3px]"
            style={{ fontSize: 'clamp(3rem,7vw,5rem)' }}>
            What Clients Say
          </h2>
          <div className="gold-divider mt-4 mx-auto" style={{ margin: '16px auto 0' }} />
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="liquid-glass rounded-[1.25rem] p-8 relative flex flex-col"
              style={{ border: '1px solid rgba(200,144,26,0.08)' }}>

              <div className="text-6xl font-heading italic leading-none mb-4 select-none"
                style={{ color: 'rgba(200,144,26,0.18)' }}>&ldquo;</div>

              <p className="font-heading italic flex-1 mb-6 leading-snug"
                style={{ fontSize: 'clamp(1rem,1.4vw,1.15rem)', color: 'rgba(232,232,232,0.62)' }}>
                {t.quote}
              </p>

              <div className="flex items-center gap-3 pt-5"
                style={{ borderTop: '1px solid rgba(200,144,26,0.08)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-body flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white font-body">{t.clientName}</p>
                  <p className="text-xs font-body" style={{ color: '#c8901a' }}>{t.service}</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-6 right-6 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,#c8901a,transparent)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
