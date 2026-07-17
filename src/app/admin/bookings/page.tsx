'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Calendar, Mail, Phone, MessageSquare,
  CheckCircle2, XCircle, Clock, Loader2, ChevronDown,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

const STATUS_OPTIONS = ['PENDING','CONFIRMED','COMPLETED','CANCELLED'] as const;
type BookingStatus = typeof STATUS_OPTIONS[number];

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: '#e8b024', CONFIRMED: '#22c55e', COMPLETED: '#6366f1', CANCELLED: '#ef4444',
};
const STATUS_ICON: Record<BookingStatus, any> = {
  PENDING: Clock, CONFIRMED: CheckCircle2, COMPLETED: CheckCircle2, CANCELLED: XCircle,
};

// Matches Booking model returned by backend
interface Booking {
  id:           string;
  clientName:   string;    // camelCase — Prisma maps snake_case DB cols
  clientEmail:  string;
  clientPhone?: string;
  serviceType:  string;
  preferredDate?: string;
  message:      string;
  status:       BookingStatus;
  notes?:       string;
  submittedAt:  string;
  invoices:     { id: string; invoiceNo: string; status: string }[];
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'ALL' | BookingStatus>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes]       = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/bookings`, { headers: authHeaders() });
      setBookings(res.data);
    } catch (err: any) {
      toast.error(err?.response?.status === 401 ? 'Session expired — please log in again' : 'Failed to load bookings');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      await axios.patch(`${API_URL}/bookings/${id}`, { status }, { headers: authHeaders() });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const saveNote = async (id: string) => {
    try {
      setSavingNote(id);
      const note = notes[id] ?? '';
      await axios.patch(`${API_URL}/bookings/${id}`, { notes: note }, { headers: authHeaders() });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, notes: note } : b));
      toast.success('Note saved');
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(null); }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const filterCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {} as Record<BookingStatus, number>);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#e8e8e8', fontSize: 30, fontWeight: 300, fontStyle: 'italic' }}>
            Bookings
          </h1>
          <p className="text-sm mt-0.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
            {bookings.length} total · {bookings.filter(b => b.status === 'PENDING').length} pending
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('ALL')}
          className="px-4 py-1.5 text-xs font-medium tracking-wider uppercase font-body transition-all rounded-full"
          style={{
            background: filter === 'ALL' ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
            color: filter === 'ALL' ? '#060608' : 'rgba(232,232,232,0.5)',
            border: filter === 'ALL' ? 'none' : '1px solid rgba(200,144,26,0.12)',
          }}>
          All ({bookings.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-1.5 text-xs font-medium tracking-wider uppercase font-body transition-all rounded-full"
            style={{
              background: filter === s ? `${STATUS_COLOR[s]}22` : 'rgba(255,255,255,0.05)',
              color: filter === s ? STATUS_COLOR[s] : 'rgba(232,232,232,0.5)',
              border: filter === s ? `1px solid ${STATUS_COLOR[s]}` : '1px solid rgba(200,144,26,0.12)',
            }}>
            {s} ({filterCounts[s]})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: '#c8901a' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-[1.25rem]" style={{ border: '1px solid rgba(200,144,26,0.1)' }}>
          <Calendar size={32} className="mx-auto mb-3 opacity-30" style={{ color: '#c8901a' }} />
          <p className="font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>No bookings in this status</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const Icon    = STATUS_ICON[b.status] || Clock;
            const isOpen  = expanded === b.id;
            const color   = STATUS_COLOR[b.status];

            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[1rem]" style={{ background: '#111', border: '1px solid rgba(200,144,26,0.1)' }}>

                {/* Summary row — click to expand */}
                <button onClick={() => setExpanded(isOpen ? null : b.id)} className="w-full flex items-center gap-4 p-4 text-left">
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl"
                    style={{ background: `${color}18`, color }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-body" style={{ color: '#e8e8e8' }}>{b.clientName}</p>
                    <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                      {b.serviceType} · {new Date(b.submittedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-body font-medium flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {b.status}
                  </span>
                  <ChevronDown size={14} style={{
                    color: '#c8901a', flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-5" style={{ borderTop: '1px solid rgba(200,144,26,0.08)' }}>
                    {/* Contact + event info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-5">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm font-body">
                          <Mail size={13} style={{ color: '#c8901a', flexShrink: 0 }} />
                          <a href={`mailto:${b.clientEmail}`} className="hover:opacity-80 truncate"
                            style={{ color: 'rgba(232,232,232,0.65)' }}>
                            {b.clientEmail}
                          </a>
                        </div>
                        {b.clientPhone && (
                          <div className="flex items-center gap-2 text-sm font-body">
                            <Phone size={13} style={{ color: '#c8901a', flexShrink: 0 }} />
                            <a href={`tel:${b.clientPhone}`} className="hover:opacity-80"
                              style={{ color: 'rgba(232,232,232,0.65)' }}>
                              {b.clientPhone}
                            </a>
                          </div>
                        )}
                        {b.preferredDate && (
                          <div className="flex items-center gap-2 text-sm font-body">
                            <Calendar size={13} style={{ color: '#c8901a', flexShrink: 0 }} />
                            <span style={{ color: 'rgba(232,232,232,0.65)' }}>
                              {new Date(b.preferredDate).toLocaleDateString('en-GB', { dateStyle: 'full' })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-2 text-sm font-body">
                        <MessageSquare size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#c8901a' }} />
                        <span style={{ color: 'rgba(232,232,232,0.65)', lineHeight: 1.6 }}>{b.message}</span>
                      </div>
                    </div>

                    {/* Internal notes */}
                    <div className="mb-5">
                      <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body"
                        style={{ color: 'rgba(232,232,232,0.4)' }}>
                        Internal Notes (admin only)
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          value={notes[b.id] ?? (b.notes || '')}
                          onChange={e => setNotes(n => ({ ...n, [b.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add internal notes — not visible to client..."
                          className="flex-1 text-sm font-body"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(200,144,26,0.15)',
                            color: '#e8e8e8',
                            padding: '8px 12px',
                            outline: 'none',
                            borderRadius: '0.5rem',
                            resize: 'vertical',
                            minHeight: 60,
                          }} />
                        <button onClick={() => saveNote(b.id)} disabled={savingNote === b.id}
                          className="px-3 py-2 text-xs font-body rounded-lg self-start disabled:opacity-60"
                          style={{ background: 'rgba(200,144,26,0.12)', color: '#c8901a', border: '1px solid rgba(200,144,26,0.2)' }}>
                          {savingNote === b.id ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Status update buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xs uppercase tracking-wider font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                        Update Status:
                      </span>
                      {STATUS_OPTIONS.map(s => (
                        <button key={s} onClick={() => updateStatus(b.id, s)}
                          className="text-xs px-3 py-1.5 font-body rounded-full transition-all font-medium"
                          style={{
                            background: b.status === s ? `${STATUS_COLOR[s]}22` : 'rgba(255,255,255,0.05)',
                            color: b.status === s ? STATUS_COLOR[s] : 'rgba(232,232,232,0.5)',
                            border: `1px solid ${b.status === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.08)'}`,
                          }}>
                          {s}
                        </button>
                      ))}

                      {/* Linked invoices */}
                      {b.invoices?.length > 0 && (
                        <div className="ml-auto text-xs font-body flex items-center gap-1.5" style={{ color: 'rgba(232,232,232,0.4)' }}>
                          <span>{b.invoices.length} invoice{b.invoices.length > 1 ? 's' : ''}</span>
                          <a href="/admin/invoices" style={{ color: '#c8901a', textDecoration: 'underline' }}>View →</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
