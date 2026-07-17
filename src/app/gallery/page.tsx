'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ZoomIn, Loader2, ImageOff, ArrowLeft } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import CinematicBackground from '@/components/ui/CinematicBackground';
import Footer from '@/components/layout/Footer';
import axios from 'axios';

const CATS = ['All','Weddings','Portraits','Events','Graduations','Corporate','Video'];
const DEMO: any[] = [
  { id:'1',  src:'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', title:'Wedding Ceremony',  category:'Weddings',    width:800, height:600  },
  { id:'2',  src:'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', title:'Bridal Portrait',   category:'Portraits',   width:800, height:1000 },
  { id:'3',  src:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', title:'Corporate Event',   category:'Events',      width:800, height:600  },
  { id:'4',  src:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', title:'Graduation Day',    category:'Graduations', width:800, height:600  },
  { id:'5',  src:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', title:'Executive Portrait',category:'Corporate',   width:800, height:1000 },
  { id:'6',  src:'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80', title:'Wedding Reception', category:'Weddings',    width:800, height:600  },
  { id:'7',  src:'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80', title:'Birthday Gala',     category:'Events',      width:800, height:600  },
  { id:'8',  src:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', title:'Studio Portrait',   category:'Portraits',   width:800, height:600  },
  { id:'9',  src:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', title:'Outdoor Wedding',   category:'Weddings',    width:800, height:600  },
  { id:'10', src:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', title:'Family Portrait',   category:'Portraits',   width:800, height:600  },
  { id:'11', src:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', title:'Wedding Vows',      category:'Weddings',    width:800, height:1000 },
  { id:'12', src:'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=80', title:'Business Portrait', category:'Corporate',   width:800, height:600  },
];

export default function GalleryPage() {
  const [cat, setCat]             = useState('All');
  const [images, setImages]       = useState<any[]>(DEMO);
  const [lbIndex, setLbIndex]     = useState(-1);
  const [loading, setLoading]     = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.04 });
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const params = cat !== 'All' ? { category: cat } : {};
      const res = await axios.get(`${API}/gallery`, { params, timeout: 5000 });
      if (res.data?.length > 0) { setImages(res.data); setApiAvailable(true); }
      else setImages(DEMO.filter(d => cat === 'All' || d.category === cat));
    } catch {
      setImages(DEMO.filter(d => cat === 'All' || d.category === cat));
    } finally { setLoading(false); }
  }, [cat, API]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const filtered = images;
  const slides   = filtered.map(i => ({ src: i.src || i.imageUrl, title: i.title }));

  return (
    <>
      <div className="min-h-screen relative" style={{ background: '#060608' }}>
        {/* Canvas header bg */}
        <div className="absolute inset-0 h-[50vh] overflow-hidden pointer-events-none">
          <CinematicBackground variant="hero" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(6,6,8,0.3) 0%, rgba(6,6,8,1) 100%)' }} />
        </div>

        <div className="relative z-10 pt-28 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}>
            <Link href="/"
              className="inline-flex items-center gap-2 text-xs font-body tracking-wider uppercase mb-10 transition-opacity hover:opacity-70"
              style={{ color: 'rgba(200,144,26,0.7)' }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-14">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body"
              style={{ color: '#c8901a' }}>
              // Portfolio
            </p>
            <h1 className="font-heading italic text-white leading-[0.9] tracking-[-3px] mb-4"
              style={{ fontSize: 'clamp(3.5rem,8vw,6.5rem)' }}>
              Full Gallery
            </h1>
            <div className="gold-divider mb-5" />
            <p className="text-sm font-body font-light max-w-md leading-relaxed"
              style={{ color: 'rgba(232,232,232,0.4)' }}>
              {apiAvailable
                ? `${filtered.length} images across all categories`
                : 'Demo portfolio — connect your backend to display your real work.'}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap gap-2 mb-10">
            {CATS.map(c => {
              const active = c === cat;
              return (
                <button key={c} onClick={() => setCat(c)}
                  className="px-4 py-2 text-xs font-medium tracking-wider uppercase font-body transition-all rounded-full"
                  style={{
                    background:   active ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
                    color:        active ? '#060608' : 'rgba(232,232,232,0.5)',
                    border:       active ? 'none' : '1px solid rgba(200,144,26,0.12)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  {c}
                </button>
              );
            })}
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin" style={{ color: '#c8901a' }} />
            </div>

          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-5">
              <div className="liquid-glass w-24 h-24 rounded-full flex items-center justify-center"
                style={{ border: '1px solid rgba(200,144,26,0.15)' }}>
                <ImageOff size={32} style={{ color: 'rgba(200,144,26,0.45)' }} />
              </div>
              <div className="text-center">
                <p className="text-xl font-heading italic text-white mb-2">No images in this category</p>
                <p className="text-sm font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                  Upload images from your admin dashboard to fill this category.
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={() => setCat('All')}
                  className="liquid-glass rounded-full px-5 py-2.5 text-sm font-body font-medium"
                  style={{ color: '#c8901a', border: '1px solid rgba(200,144,26,0.25)' }}>
                  Show All Images
                </button>
                <Link href="/admin/gallery"
                  className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-body font-medium text-white">
                  Admin Gallery →
                </Link>
              </div>
            </div>

          ) : (
            /*
             * FIX: removed `layout` from each item and changed AnimatePresence
             * from mode="popLayout" to mode="sync".
             *
             * WHY IT WAS LEAVING BLANK SPACES:
             * mode="popLayout" immediately removes exiting items from the CSS
             * columns flow and inserts a Framer Motion placeholder while they
             * animate out. CSS `columns` layout does not understand that
             * placeholder — it reserves the column slot but renders nothing
             * visible there, producing blank gaps until the animation finishes.
             *
             * `layout` on each item compounds this: Framer measures DOM
             * positions and applies transforms to animate items to their new
             * spots, but `columns` places items in ways Framer can't predict,
             * so items visually land in wrong positions during transitions.
             *
             * mode="sync" lets CSS columns reflow naturally as items enter/exit,
             * and dropping `layout` means no transform-based repositioning
             * fights the columns algorithm.
             */
            <div
              ref={ref}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="sync">
                {filtered.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.025, 0.25) }}
                    className="group relative overflow-hidden cursor-pointer rounded-[0.75rem]"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => setLbIndex(i)}
                  >
                    <Image
                      src={img.src || img.imageUrl}
                      alt={img.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,(max-width:1280px) 33vw,25vw"
                    />

                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'rgba(6,6,8,0.72)', backdropFilter: 'blur(3px)' }}
                    >
                      <div className="liquid-glass rounded-full w-12 h-12 flex items-center justify-center mb-3">
                        <ZoomIn size={18} style={{ color: '#e8b024' }} />
                      </div>

                      <p className="text-sm font-medium text-white tracking-wide font-body">
                        {img.title}
                      </p>

                      <span
                        className="text-xs mt-1 px-3 py-0.5 rounded-full font-body"
                        style={{ background: 'rgba(200,144,26,0.2)', color: '#e8b024' }}
                      >
                        {img.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* CTA */}
          {filtered.length > 0 && (
            <div className="text-center mt-16 pt-12"
              style={{ borderTop: '1px solid rgba(200,144,26,0.08)' }}>
              <h3 className="text-2xl font-heading italic text-white mb-3">Love what you see?</h3>
              <p className="text-sm font-body mb-7" style={{ color: 'rgba(232,232,232,0.4)' }}>
                Let&apos;s create something extraordinary together.
              </p>
              <Link href="/#booking"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold font-body tracking-wider uppercase rounded-full"
                style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                Book a Session →
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <Lightbox open={lbIndex >= 0} close={() => setLbIndex(-1)} index={lbIndex} slides={slides} />
    </>
  );
}