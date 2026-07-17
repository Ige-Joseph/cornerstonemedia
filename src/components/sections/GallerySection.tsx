'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useInView } from 'react-intersection-observer';
import { ZoomIn, Loader2, ImageOff } from 'lucide-react';
import axios from 'axios';

const CATS = ['All', 'Weddings', 'Portraits', 'Events', 'Graduations', 'Corporate', 'Video'];

const DEMO: any[] = [
  { id: '1', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', title: 'Wedding Ceremony', category: 'Weddings', width: 800, height: 600 },
  { id: '2', src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', title: 'Bridal Portrait', category: 'Portraits', width: 800, height: 1000 },
  { id: '3', src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', title: 'Corporate Event', category: 'Events', width: 800, height: 600 },
];

export default function GallerySection() {
  const [cat, setCat] = useState('All');
  const [images, setImages] = useState<any[]>(DEMO);
  const [lbIndex, setLbIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);

  const { ref } = useInView({ triggerOnce: true, threshold: 0.04 });

  const API =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
    'http://localhost:3001';

  // ✅ NORMALIZER (CRITICAL FIX)
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return '';

    if (url.startsWith('http')) {
      return url;
    }

    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const normalizeImages = (data: any[]) => {
    return data.map((img) => {
      const imageUrl = toAbsoluteUrl(img.imageUrl || img.src);
      const thumbUrl = img.thumbnailUrl
        ? toAbsoluteUrl(img.thumbnailUrl)
        : imageUrl;

      return {
        ...img,
        src: imageUrl,
        thumb: thumbUrl,
      };
    });
  };

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);

      const params = cat !== 'All' ? { category: cat } : {};

      const res = await axios.get(`${API}/gallery`, {
        params,
        timeout: 8000,
      });

      if (res.data?.length > 0) {
        setImages(normalizeImages(res.data));
        setApiAvailable(true);
      } else {
        setImages(DEMO.filter((d) => cat === 'All' || d.category === cat));
      }
    } catch {
      setImages(DEMO.filter((d) => cat === 'All' || d.category === cat));
    } finally {
      setLoading(false);
    }
  }, [cat, API]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filtered = images;

  // ✅ FIXED LIGHTBOX (NO MIXED SOURCES)
  const slides = filtered.map((i) => ({
    src: i.src,
    title: i.title,
  }));

  return (
    <section
      id="gallery"
      className="section-padding relative"
      style={{ background: '#07070a' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
          <div>
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body text-[#c8901a]">
              // Portfolio
            </p>
            <h2 className="font-heading italic text-white leading-[0.9] tracking-[-3px]"
              style={{ fontSize: 'clamp(3rem,7vw,5.5rem)' }}>
              Our Gallery
            </h2>
          </div>

          <p className="text-sm font-body font-light max-w-xs leading-relaxed text-white/40">
            {apiAvailable
              ? `${filtered.length} images across all categories`
              : 'Demo portfolio — connect backend to load real images.'}
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATS.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-4 py-2 text-xs uppercase rounded-full"
                style={{
                  background: active
                    ? 'linear-gradient(135deg,#c8901a,#e8b024)'
                    : 'rgba(255,255,255,0.05)',
                  color: active ? '#060608' : 'rgba(255,255,255,0.5)',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#c8901a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/40">
            <ImageOff className="mx-auto mb-4" />
            No images yet
          </div>
        ) : (
          <div
            ref={ref}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.25) }}
                className="group relative overflow-hidden cursor-pointer rounded-lg aspect-square"
                onClick={() => setLbIndex(i)}
              >
              <Image
                src={img.thumb || img.src || img.imageUrl}
                alt={img.title || 'Gallery image'}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
              />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/60 transition">
                  <ZoomIn className="text-yellow-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={lbIndex >= 0}
        close={() => setLbIndex(-1)}
        index={lbIndex}
        slides={slides}
      />
    </section>
  );
}