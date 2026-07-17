'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Eye, EyeOff, Edit2, X,
  Save, Loader2, Quote, GripVertical,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

interface Testimonial {
  id:         string;
  clientName: string;
  service:    string;
  quote:      string;
  initials:   string;
  isVisible:  boolean;
  rankKey:    string;
}

interface TestimonialForm {
  clientName: string;
  service:    string;
  quote:      string;
  initials:   string;
}

// ── Instagram-style swap helper ───────────────────────────────────────────────
function swapItems(list: Testimonial[], fromId: string, toId: string): Testimonial[] {
  const items = [...list];
  const fromIndex = items.findIndex(i => i.id === fromId);
  const toIndex   = items.findIndex(i => i.id === toId);
  if (fromIndex === -1 || toIndex === -1) return list;
  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
  return items;
}

export default function AdminTestimonialsPage() {
  const [items, setItems]           = useState<Testimonial[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Testimonial | null>(null);
  const [saving, setSaving]         = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestimonialForm>();

  // Auto-derive initials from clientName
  const watchName = watch('clientName', '');
  useEffect(() => {
    if (!editing) {
      const derived = watchName
        .split(/[\s&]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .join('');
      setValue('initials', derived);
    }
  }, [watchName, editing, setValue]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/testimonials/admin/all`, { headers: authHeaders() });
      setItems(res.data);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    reset({ clientName: '', service: '', quote: '', initials: '' });
    setShowForm(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    reset({ clientName: t.clientName, service: t.service, quote: t.quote, initials: t.initials });
    setShowForm(true);
  };

  const onSubmit = async (data: TestimonialForm) => {
    try {
      setSaving(true);
      if (editing) {
        const res = await axios.patch(`${API_URL}/testimonials/${editing.id}`, data, { headers: authHeaders() });
        setItems(prev => prev.map(t => t.id === editing.id ? res.data : t));
        toast.success('Testimonial updated');
      } else {
        const res = await axios.post(`${API_URL}/testimonials`, data, { headers: authHeaders() });
        setItems(prev => [...prev, res.data]);
        toast.success('Testimonial added');
      }
      setShowForm(false);
      setEditing(null);
      reset();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleVisibility = async (t: Testimonial) => {
    try {
      const res = await axios.patch(
        `${API_URL}/testimonials/${t.id}`,
        { isVisible: !t.isVisible },
        { headers: authHeaders() },
      );
      setItems(prev => prev.map(i => i.id === t.id ? res.data : i));
      toast.success(t.isVisible ? 'Hidden from website' : 'Now visible on website');
    } catch {
      toast.error('Update failed');
    }
  };

  const remove = async (t: Testimonial) => {
    if (!confirm(`Delete testimonial from "${t.clientName}"?`)) return;
    try {
      await axios.delete(`${API_URL}/testimonials/${t.id}`, { headers: authHeaders() });
      setItems(prev => prev.filter(i => i.id !== t.id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Instagram-style drag reorder ──────────────────────────────────────────
  const handleDragEnd = (draggedId: string, pointX: number, pointY: number) => {
    setDraggingId(null);

    const elements = document.elementsFromPoint(pointX, pointY);
    const target   = elements.find(el => (el as HTMLElement).dataset?.id) as HTMLElement | undefined;
    const targetId = target?.dataset?.id;

    if (!targetId || targetId === draggedId) return;

    // 1. Instant optimistic UI swap
    setItems(prev => swapItems(prev, draggedId, targetId));

    // 2. Backend sync
    setReordering(true);
    axios
      .patch(
        `${API_URL}/testimonials/move`,
        { itemId: draggedId, targetId },
        { headers: authHeaders() },
      )
      .catch(() => {
        toast.error('Reorder failed — reloading');
        load();
      })
      .finally(() => setReordering(false));
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp = {
    background:  'rgba(255,255,255,0.04)',
    border:      '1px solid rgba(200,144,26,0.15)',
    color:       '#e8e8e8',
    width:       '100%',
    padding:     '9px 12px',
    fontSize:    '13px',
    fontFamily:  'Barlow, sans-serif',
    outline:     'none',
    borderRadius:'0.5rem',
  } as React.CSSProperties;

  const onFocus = (e: any) => {
    e.target.style.borderColor = '#c8901a';
    e.target.style.background  = 'rgba(200,144,26,0.06)';
  };
  const onBlur = (e: any) => {
    e.target.style.borderColor = 'rgba(200,144,26,0.15)';
    e.target.style.background  = 'rgba(255,255,255,0.04)';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond,serif', color: '#e8e8e8', fontSize: 30, fontWeight: 300, fontStyle: 'italic' }}>
            Testimonials
          </h1>
          <p className="text-sm mt-0.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
            {items.length} total · {items.filter(t => t.isVisible).length} visible on website
            {reordering && <span style={{ color: '#c8901a' }}> · saving order…</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReorderMode(r => !r)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium font-body rounded-full transition-all"
            style={{
              background: reorderMode ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
              color:      reorderMode ? '#060608' : 'rgba(232,232,232,0.55)',
              border:     reorderMode ? 'none' : '1px solid rgba(200,144,26,0.12)',
            }}
          >
            <GripVertical size={13} />
            {reorderMode ? 'Done' : 'Reorder'}
            {reordering && <Loader2 size={11} className="animate-spin" />}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-body tracking-wider rounded-full"
            style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}
          >
            <Plus size={15} /> Add Testimonial
          </button>
        </div>
      </div>

      {/* ── Create / Edit form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6 mb-6 rounded-[1.25rem]"
            style={{ background: '#111', border: '1px solid rgba(200,144,26,0.15)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium font-body" style={{ color: '#c8901a' }}>
                {editing ? 'Edit Testimonial' : 'Add Testimonial'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); reset(); }}
                style={{ color: 'rgba(232,232,232,0.4)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Client Name */}
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body"
                    style={{ color: 'rgba(232,232,232,0.45)' }}>Client Name *</label>
                  <input
                    {...register('clientName', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })}
                    placeholder="e.g. Adaeze & Emeka Okonkwo"
                    style={inp} onFocus={onFocus} onBlur={onBlur}
                  />
                  {errors.clientName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.clientName.message}</p>}
                </div>

                {/* Service */}
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body"
                    style={{ color: 'rgba(232,232,232,0.45)' }}>Service *</label>
                  <input
                    {...register('service', { required: 'Required' })}
                    placeholder="e.g. Wedding Photography"
                    style={inp} onFocus={onFocus} onBlur={onBlur}
                  />
                  {errors.service && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.service.message}</p>}
                </div>

                {/* Initials */}
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body"
                    style={{ color: 'rgba(232,232,232,0.45)' }}>Initials (auto-derived)</label>
                  <input
                    {...register('initials')} maxLength={4}
                    placeholder="e.g. AO"
                    style={inp} onFocus={onFocus} onBlur={onBlur}
                  />
                  <p className="text-[10px] mt-1 font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
                    Auto-filled from name — override if needed
                  </p>
                </div>
              </div>

              {/* Quote */}
              <div className="mb-5">
                <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body"
                  style={{ color: 'rgba(232,232,232,0.45)' }}>Testimonial Quote * (20–500 characters)</label>
                <textarea
                  {...register('quote', {
                    required:  'Required',
                    minLength: { value: 20,  message: 'Min 20 characters' },
                    maxLength: { value: 500, message: 'Max 500 characters' },
                  })}
                  rows={3}
                  placeholder="What did the client say about their experience?"
                  style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                {errors.quote && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.quote.message}</p>}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium font-body rounded-full disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : <><Save size={14} /> {editing ? 'Save Changes' : 'Add Testimonial'}</>}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); reset(); }}
                  className="px-5 py-2.5 text-sm border font-body rounded-full"
                  style={{ borderColor: 'rgba(200,144,26,0.2)', color: 'rgba(232,232,232,0.5)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main list ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: '#c8901a' }} />
        </div>

      ) : items.length === 0 ? (
        <div className="text-center py-20 rounded-[1.25rem]"
          style={{ border: '1px solid rgba(200,144,26,0.1)' }}>
          <Quote size={32} className="mx-auto mb-3 opacity-30" style={{ color: '#c8901a' }} />
          <p className="font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
            No testimonials yet. Add your first one above.
          </p>
        </div>

      ) : reorderMode ? (
        /* ── Drag-to-reorder list ── */
        <>
          <p className="text-xs font-body mb-3" style={{ color: 'rgba(232,232,232,0.3)' }}>
            Drag to reorder · order is reflected on the website
          </p>
          <motion.div layout className="flex flex-col gap-3">
            {items.map(t => (
              <motion.div
                key={t.id}
                data-id={t.id}
                layout
                layoutId={t.id}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                whileDrag={{
                  scale:     1.02,
                  zIndex:    50,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                }}
                transition={{
                  layout: { type: 'spring', stiffness: 500, damping: 38 },
                }}
                onDragStart={() => setDraggingId(t.id)}
                onDragEnd={(_event, info) => handleDragEnd(t.id, info.point.x, info.point.y)}
                className="flex items-start gap-4 p-4 rounded-[0.875rem] cursor-grab active:cursor-grabbing"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border:     '1px solid rgba(200,144,26,0.2)',
                  opacity:    draggingId && draggingId !== t.id ? 0.6 : 1,
                }}
              >
                {/* Drag handle */}
                <div className="flex-shrink-0 mt-1" style={{ color: 'rgba(200,144,26,0.4)' }}>
                  <GripVertical size={16} />
                </div>

                {/* Initials avatar */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-body pointer-events-none"
                  style={{ background: 'rgba(200,144,26,0.15)', color: '#c8901a' }}>
                  {t.initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium font-body truncate" style={{ color: '#e8e8e8' }}>
                      {t.clientName}
                    </p>
                    <span className="text-[10px] font-body px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(200,144,26,0.1)', color: '#c8901a' }}>
                      {t.service}
                    </span>
                    {!t.isVisible && (
                      <span className="text-[10px] font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>hidden</span>
                    )}
                  </div>
                  <p className="text-xs font-body line-clamp-2" style={{ color: 'rgba(232,232,232,0.5)' }}>
                    "{t.quote}"
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>

      ) : (
        /* ── Normal browse list with edit / visibility / delete ── */
        <div className="flex flex-col gap-3">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="flex items-start gap-4 p-4 rounded-[0.875rem]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border:     `1px solid ${t.isVisible ? 'rgba(200,144,26,0.15)' : 'rgba(255,255,255,0.06)'}`,
                opacity:    t.isVisible ? 1 : 0.6,
              }}
            >
              {/* Initials avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-body"
                style={{ background: 'rgba(200,144,26,0.15)', color: '#c8901a' }}>
                {t.initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold font-body" style={{ color: '#e8e8e8' }}>
                    {t.clientName}
                  </p>
                  <span className="text-[10px] font-body px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(200,144,26,0.1)', color: '#c8901a' }}>
                    {t.service}
                  </span>
                  {!t.isVisible && (
                    <span className="text-[10px] font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>hidden</span>
                  )}
                </div>
                <p className="text-sm font-body leading-relaxed" style={{ color: 'rgba(232,232,232,0.55)' }}>
                  "{t.quote}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleVisibility(t)}
                  title={t.isVisible ? 'Hide' : 'Publish'}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(200,144,26,0.1)', color: '#c8901a' }}
                >
                  {t.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => openEdit(t)}
                  title="Edit"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(232,232,232,0.6)' }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => remove(t)}
                  title="Delete"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}