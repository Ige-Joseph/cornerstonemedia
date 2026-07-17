'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Images, CalendarCheck, FileText, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#e8b024', CONFIRMED: '#22c55e', COMPLETED: '#6366f1', CANCELLED: '#ef4444',
};

interface Stats {
  galleryCount:    number;
  bookingsPending: number;
  bookingsTotal:   number;
  invoicesDraft:   number;
  invoicesPaid:    number;
  invoicesTotal:   number;
  invoicesTotalRevenue: number;
  recentBookings:  any[];
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = authHeaders();

        // Parallel fetch — if any fail individually, we degrade gracefully
        const [gallery, bookings, invoices] = await Promise.allSettled([
          axios.get(`${API_URL}/gallery/admin/all`, { headers }),
          axios.get(`${API_URL}/bookings`, { headers }),
          axios.get(`${API_URL}/invoices`, { headers }),
        ]);

        const galleryData  = gallery.status  === 'fulfilled' ? gallery.value.data  : [];
        const bookingsData = bookings.status === 'fulfilled' ? bookings.value.data : [];
        const invoicesData = invoices.status === 'fulfilled' ? invoices.value.data : [];

        setStats({
          galleryCount:    galleryData.length,
          bookingsPending: bookingsData.filter((b: any) => b.status === 'PENDING').length,
          bookingsTotal:   bookingsData.length,
          invoicesDraft:   invoicesData.filter((i: any) => i.status === 'DRAFT').length,
          invoicesPaid:    invoicesData.filter((i: any) => i.status === 'PAID').length,
          invoicesTotal:   invoicesData.length,
          // Sum all PAID invoice totals for revenue figure
          invoicesTotalRevenue: invoicesData
            .filter((i: any) => i.status === 'PAID')
            .reduce((sum: number, i: any) => sum + Number(i.total), 0),
          recentBookings: bookingsData.slice(0, 5),
        });
      } catch (err: any) {
        setError('Could not load dashboard data. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      label: 'Gallery Images',
      value: stats?.galleryCount ?? 0,
      icon: Images,
      href: '/admin/gallery',
      sub: 'Manage portfolio',
      highlight: false,
    },
    {
      label: 'Pending Bookings',
      value: stats?.bookingsPending ?? 0,
      icon: Clock,
      href: '/admin/bookings',
      sub: `${stats?.bookingsTotal ?? 0} total requests`,
      highlight: (stats?.bookingsPending ?? 0) > 0,
    },
    {
      label: 'Draft Invoices',
      value: stats?.invoicesDraft ?? 0,
      icon: FileText,
      href: '/admin/invoices',
      sub: `${stats?.invoicesPaid ?? 0} paid`,
      highlight: false,
    },
    {
      label: 'Revenue (Paid)',
      value: `₦${(stats?.invoicesTotalRevenue ?? 0).toLocaleString()}`,
      icon: CalendarCheck,
      href: '/admin/invoices',
      sub: `${stats?.invoicesTotal ?? 0} invoices total`,
      highlight: false,
      isString: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#e8e8e8', fontSize: 32, fontWeight: 300, fontStyle: 'italic' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
          Welcome back. Here&apos;s an overview of your studio.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-5 py-4 rounded-xl font-body text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}>
              <Link href={card.href}>
                <div className="p-6 transition-all duration-200 cursor-pointer group rounded-[1rem]"
                  style={{
                    background: '#111',
                    border: `1px solid ${card.highlight ? 'rgba(200,144,26,0.35)' : 'rgba(200,144,26,0.1)'}`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8901a')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = card.highlight ? 'rgba(200,144,26,0.35)' : 'rgba(200,144,26,0.1)')}>

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(200,144,26,0.1)', color: '#c8901a' }}>
                      <Icon size={18} />
                    </div>
                    {loading && <div className="w-8 h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />}
                  </div>

                  <div className="text-3xl font-light mb-1"
                    style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#e8e8e8' }}>
                    {loading ? '—' : card.value}
                  </div>
                  <div className="text-xs font-medium font-body mb-0.5" style={{ color: '#c8901a' }}>{card.label}</div>
                  <div className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.35)' }}>{card.sub}</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.5 }}
        className="p-6 rounded-[1rem]"
        style={{ background: '#111', border: '1px solid rgba(200,144,26,0.1)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#e8e8e8', fontSize: 20, fontWeight: 300, fontStyle: 'italic' }}>
            Recent Bookings
          </h2>
          <Link href="/admin/bookings" className="text-xs tracking-wider uppercase font-body" style={{ color: '#c8901a' }}>
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (stats?.recentBookings?.length ?? 0) > 0 ? (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {stats!.recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium font-body truncate" style={{ color: '#e8e8e8' }}>{b.clientName}</p>
                  <p className="text-xs font-body truncate" style={{ color: 'rgba(232,232,232,0.4)' }}>{b.serviceType}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium"
                    style={{ background: `${STATUS_COLOR[b.status] || '#888'}20`, color: STATUS_COLOR[b.status] || '#888' }}>
                    {b.status}
                  </span>
                  <p className="text-xs mt-1 font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
                    {new Date(b.submittedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: 'rgba(200,144,26,0.3)' }} />
            <p className="text-sm font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>No bookings yet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
