'use client';

/**
 * REORDER ENGINE: @dnd-kit  (npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities)
 *
 * RACE-CONDITION FIXES:
 *
 * Fix 1 — Drag lock while saving.
 * Each SortableGalleryCard receives `disabled={savingOrder}`. When a save is
 * in flight, useSortable disables both dragging and dropping on every card so
 * no new drag can begin until the previous one is fully committed to the DB.
 * The cursor changes to "wait" and a subtle opacity drop gives visual feedback.
 *
 * Fix 2 — Skip silentReload if a new drag has started.
 * We track whether a drag is currently active via a ref (no re-render cost).
 * The silentReload that runs after a successful save checks this ref before
 * calling setImages. If the user grabbed another card before the network
 * round-trip completed, the reload is skipped — the next drag's own save +
 * reload will bring everything back in sync.
 *
 * Fix 3 — Correct optimistic update for filtered views (from previous session).
 * Remove the moved item from the full array, then re-insert it immediately
 * adjacent to its new filtered neighbour rather than swapping at fixed
 * positions. This keeps interleaved items from other categories in place.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Upload, Trash2, Eye, EyeOff, Loader2, Plus,
  ImageOff, X, CheckCircle2, AlertCircle, FolderOpen,
  ArrowUpDown,
} from 'lucide-react';

// ── dnd-kit ──────────────────────────────────────────────────────────────────
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_URL     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CATEGORIES  = ['Weddings', 'Portraits', 'Events', 'Graduations', 'Corporate', 'Video'];
const MAX_FILES   = 20;
const MAX_SIZE_MB = 20;
const UPLOAD_CHUNK_SIZE = 4; // how many files go in each batch request
const DELETE_UNDO_MS    = 4000; // window during which a delete can be undone

function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  isPublished: boolean;
  rankKey: string;
}

interface PendingFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── CardContent ───────────────────────────────────────────────────────────────
// Pure visual — shared by SortableGalleryCard (placeholder) and DragOverlay
// (floating copy). No drag logic here.
function CardContent({ img }: { img: GalleryImage }) {
  return (
    <>
      <div className="aspect-square relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.thumbnailUrl || img.imageUrl}
          alt={img.title}
          className="w-full h-full object-cover pointer-events-none"
        />
        {!img.isPublished && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}>
            <EyeOff size={18} style={{ color: '#c8901a' }} />
          </div>
        )}
      </div>
      <div className="p-2" style={{ background: '#111' }}>
        <p className="text-xs font-medium truncate font-body" style={{ color: '#e8e8e8' }}>
          {img.title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs font-body" style={{ color: '#c8901a' }}>{img.category}</p>
          {!img.isPublished && (
            <span className="text-[10px] font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
              hidden
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ── SortableGalleryCard ───────────────────────────────────────────────────────
// The in-grid placeholder during drag. Becomes fully disabled (no new drag
// can start) while `savingOrder` is true — this is the drag lock.
function SortableGalleryCard({
  img,
  disabled,
}: {
  img: GalleryImage;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: img.id,
    // KEY: disabled=true makes this card neither draggable nor droppable.
    // Passes through to all sensors — no new drag can begin until the current
    // save completes and disabled flips back to false.
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity:    isDragging ? 0.35 : disabled ? 0.6 : 1,
        visibility: isDragging ? 'hidden' : 'visible',
        border:     '1px solid rgba(200,144,26,0.25)',
        // Change cursor to signal the lock state to the user
        cursor:     disabled ? 'wait' : 'grab',
      }}
      className="relative overflow-hidden rounded-[0.75rem] active:cursor-grabbing select-none"
    >
      <CardContent img={img} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminGalleryPage() {
  const [images, setImages]           = useState<GalleryImage[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('All');
  const [reorderMode, setReorderMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [isDragging, setIsDragging]   = useState(false); // upload drop-zone only
  const [pending, setPending]         = useState<PendingFile[]>([]);
  const [category, setCategory]       = useState(CATEGORIES[0]);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GalleryImage | null>(null);

  // Ref that tracks whether a drag is currently active.
  // Used to skip silentReload if the user grabbed another card before the
  // previous save's network round-trip completed. Ref (not state) so it
  // can be read inside async functions without stale closure issues.
  const dragActiveRef = useRef(false);

  // Pending delete timers, keyed by image id. Holds the timeout handle so an
  // "Undo" click can cancel it before the real DELETE request fires.
  const pendingDeleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── dnd-kit sensors ────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,    { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/gallery/admin/all`, { headers: authHeaders() });
      setImages(res.data);
    } catch (err: any) {
      toast.error(err?.response?.status === 401 ? 'Session expired' : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  // Silent reload — no spinner. Only updates state if no drag is in progress
  // (dragActiveRef.current === false). This prevents a network response from
  // a completed save from overwriting state mid-drag.
  const silentReload = async () => {
    try {
      const res = await axios.get(`${API_URL}/gallery/admin/all`, { headers: authHeaders() });
      // Guard: if the user started a new drag while this request was in flight,
      // skip the state update. The new drag's own save + reload will reconcile.
      if (!dragActiveRef.current) {
        setImages(res.data);
      }
    } catch {
      // Non-critical — next navigation or manual refresh will reconcile.
    }
  };

  useEffect(() => { load(); }, []);

  // Clean up any outstanding delete timers on unmount so they don't fire
  // (and call setState) after the component is gone.
  useEffect(() => {
    return () => {
      pendingDeleteTimers.current.forEach(t => clearTimeout(t));
      pendingDeleteTimers.current.clear();
    };
  }, []);

  // ── File upload helpers ────────────────────────────────────────────────────
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr   = Array.from(newFiles);
    const valid = arr.filter(f => {
      if (!f.type.startsWith('image/'))       { toast.error(`${f.name}: not an image`);              return false; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`${f.name}: exceeds ${MAX_SIZE_MB} MB`); return false; }
      return true;
    });
    const remaining = MAX_FILES - pending.length;
    if (valid.length > remaining)
      toast.error(`Max ${MAX_FILES} files per batch. ${valid.length - remaining} ignored.`);
    const toAdd = valid.slice(0, remaining).map(f => ({
      id:      Math.random().toString(36).slice(2),
      file:    f,
      preview: URL.createObjectURL(f),
      status:  'pending' as const,
    }));
    setPending(p => [...p, ...toAdd]);
  }, [pending.length]);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) =>
    setPending(p => {
      const item = p.find(f => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return p.filter(f => f.id !== id);
    });

  // ── Batch upload (chunked) ─────────────────────────────────────────────────
  // Files are sent in chunks of UPLOAD_CHUNK_SIZE rather than one giant
  // request. This keeps any single request small (less likely to hit a
  // timeout on the storage provider) and lets progress update chunk-by-chunk
  // instead of jumping straight from 0% to 100%. Per-file success/failure
  // from each chunk's response is still tracked individually, same as before.
  const handleBatchUpload = async () => {
    const toUpload = pending.filter(f => f.status === 'pending');
    if (!toUpload.length) { toast.error('No files to upload'); return; }

    setUploading(true);
    setUploadProgress({ done: 0, total: toUpload.length });
    setPending(p => p.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f));

    const chunks = chunkArray(toUpload, UPLOAD_CHUNK_SIZE);
    let doneCount = 0;
    let succeededTotal = 0;
    let failedTotal = 0;
    let hadFatalError = false;

    for (const chunk of chunks) {
      const fd = new FormData();
      fd.append('category', category);
      fd.append('isPublished', 'true');
      chunk.forEach(pf => fd.append('images', pf.file));

      try {
        const res = await axios.post(`${API_URL}/gallery/batch`, fd, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
        });

        const { succeeded, failed } = res.data as {
          succeeded: any[];
          failed: { name: string; error: string }[];
        };

        const failedMap = new Map(failed.map((f: any) => [f.name, f.error]));
        setPending(p => p.map(pf => {
          if (!chunk.find(c => c.id === pf.id)) return pf;
          return failedMap.has(pf.file.name)
            ? { ...pf, status: 'error', error: failedMap.get(pf.file.name) }
            : { ...pf, status: 'done' };
        }));

        succeededTotal += succeeded.length;
        failedTotal    += failed.length;
      } catch (err: any) {
        // This chunk failed outright — mark every file in it as errored and
        // keep going with the remaining chunks rather than aborting the
        // whole batch.
        hadFatalError = true;
        const msg = err?.response?.data?.message;
        const chunkError = Array.isArray(msg) ? msg[0] : (msg || 'Upload failed');
        setPending(p => p.map(pf =>
          chunk.find(c => c.id === pf.id) ? { ...pf, status: 'error', error: chunkError } : pf
        ));
        failedTotal += chunk.length;
      }

      doneCount += chunk.length;
      setUploadProgress({ done: doneCount, total: toUpload.length });
    }

    if (succeededTotal) {
      toast.success(`${succeededTotal} image${succeededTotal > 1 ? 's' : ''} uploaded successfully`);
      load();
    }
    if (failedTotal)
      toast.error(`${failedTotal} file${failedTotal > 1 ? 's' : ''} failed — see details below`);
    if (hadFatalError && !succeededTotal)
      toast.error('Batch upload failed');

    setUploading(false);
  };

  const clearCompleted = () => {
    setPending(p => {
      p.filter(f => f.status === 'done' || f.status === 'error').forEach(f => URL.revokeObjectURL(f.preview));
      return p.filter(f => f.status === 'pending' || f.status === 'uploading');
    });
    setUploadProgress(null);
  };

  // ── Gallery actions ────────────────────────────────────────────────────────
  const togglePublish = async (img: GalleryImage) => {
    try {
      await axios.patch(`${API_URL}/gallery/${img.id}`, { isPublished: !img.isPublished }, { headers: authHeaders() });
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, isPublished: !i.isPublished } : i));
      toast.success(img.isPublished ? 'Hidden from gallery' : 'Published to gallery');
    } catch { toast.error('Update failed'); }
  };

  // Delete with a real undo window. The image is removed from the UI
  // immediately, but the actual DELETE request is deferred for
  // DELETE_UNDO_MS. If the user clicks "Undo" before the timer fires, we
  // cancel the timer and restore the image — no DB call ever happens, so
  // there's nothing to reverse. If the timer fires first, the image is
  // actually deleted and undo is no longer possible.
  // Called once the user confirms in the themed modal (see confirmDelete state).
  const performDelete = (img: GalleryImage) => {
    // Optimistic removal
    setImages(prev => prev.filter(i => i.id !== img.id));

    const timer = setTimeout(async () => {
      pendingDeleteTimers.current.delete(img.id);
      try {
        await axios.delete(`${API_URL}/gallery/${img.id}`, { headers: authHeaders() });
      } catch {
        toast.error(`Failed to delete "${img.title}" — restoring`);
        setImages(prev => prev.some(i => i.id === img.id) ? prev : [img, ...prev]);
      }
    }, DELETE_UNDO_MS);

    pendingDeleteTimers.current.set(img.id, timer);

    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Deleted "{img.title}"</span>
        <button
          onClick={() => {
            const pendingTimer = pendingDeleteTimers.current.get(img.id);
            if (pendingTimer) {
              clearTimeout(pendingTimer);
              pendingDeleteTimers.current.delete(img.id);
              setImages(prev => prev.some(i => i.id === img.id) ? prev : [img, ...prev]);
              toast.success('Restored');
            }
            toast.dismiss(t.id);
          }}
          style={{ color: '#c8901a', fontWeight: 600 }}
        >
          Undo
        </button>
      </div>
    ), { duration: DELETE_UNDO_MS });
  };

  const filtered = filter === 'All' ? images : images.filter(i => i.category === filter);

  // ── dnd-kit handlers ───────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    dragActiveRef.current = true;  // mark drag as active for silentReload guard
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    dragActiveRef.current = false;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = filtered.findIndex(i => i.id === activeId);
    const newIndex = filtered.findIndex(i => i.id === overId);

    // CRITICAL: prevent corrupted reorder when dnd-kit gives an invalid target
    if (oldIndex === -1 || newIndex === -1) {
      toast.error('Invalid reorder target');
      return;
    }

    const newFiltered = arrayMove(filtered, oldIndex, newIndex);

    const movedIndex = newFiltered.findIndex(i => i.id === activeId);

    if (movedIndex === -1) {
      toast.error('Could not calculate new order');
      return;
    }

    const beforeId = movedIndex > 0 ? newFiltered[movedIndex - 1].id : null;
    const afterId =
      movedIndex < newFiltered.length - 1
        ? newFiltered[movedIndex + 1].id
        : null;

    const previousImages = images;

    // Optimistic update
    setImages(prev => {
      const movedItem = prev.find(i => i.id === activeId);

      if (!movedItem) return prev;

      const withoutMoved = prev.filter(i => i.id !== activeId);

      if (beforeId) {
        const idx = withoutMoved.findIndex(i => i.id === beforeId);
        if (idx !== -1) {
          return [
            ...withoutMoved.slice(0, idx + 1),
            movedItem,
            ...withoutMoved.slice(idx + 1),
          ];
        }
      }

      if (afterId) {
        const idx = withoutMoved.findIndex(i => i.id === afterId);
        if (idx !== -1) {
          return [
            ...withoutMoved.slice(0, idx),
            movedItem,
            ...withoutMoved.slice(idx),
          ];
        }
      }

      return [movedItem, ...withoutMoved];
    });

    try {
      setSavingOrder(true);

      await axios.patch(
        `${API_URL}/gallery/move`,
        {
          itemId: activeId,
          beforeId,
          afterId,
        },
        { headers: authHeaders() }
      );

      await silentReload();
    } catch {
      toast.error('Failed to save new order — reverting');
      setImages(previousImages);
      await load();
    } finally {
      setSavingOrder(false);
    }
  };

  const activeImage = activeId ? images.find(i => i.id === activeId) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', color:'#e8e8e8', fontSize:30, fontWeight:300, fontStyle:'italic' }}>
            Gallery
          </h1>
          <p className="text-sm mt-0.5 font-body" style={{ color:'rgba(232,232,232,0.4)' }}>
            {images.length} images · {images.filter(i => i.isPublished).length} published
          </p>
        </div>
        <button
          onClick={() => setShowUpload(s => !s)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-body tracking-wider rounded-full"
          style={{ background:'linear-gradient(135deg,#c8901a,#e8b024)', color:'#060608' }}
        >
          <Plus size={15} /> Upload Images
        </button>
      </div>

      {/* ── BATCH UPLOAD PANEL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            className="mb-6 rounded-[1.25rem] overflow-hidden"
            style={{ background:'#111', border:'1px solid rgba(200,144,26,0.15)' }}
          >
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom:'1px solid rgba(200,144,26,0.08)' }}>
              <div>
                <h2 className="text-base font-medium font-body" style={{ color:'#c8901a' }}>Batch Upload</h2>
                <p className="text-xs font-body mt-0.5" style={{ color:'rgba(232,232,232,0.35)' }}>
                  Drag &amp; drop up to {MAX_FILES} images · max {MAX_SIZE_MB} MB each · JPEG, PNG, WebP, AVIF
                </p>
              </div>
              <button onClick={() => { setShowUpload(false); clearCompleted(); }}
                style={{ color:'rgba(232,232,232,0.4)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <label className="text-[10px] tracking-widest uppercase font-body flex-shrink-0"
                  style={{ color:'rgba(232,232,232,0.45)' }}>
                  Category for all *
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className="px-3 py-1 text-xs font-body rounded-full transition-all"
                      style={{
                        background: category === c ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
                        color:      category === c ? '#060608' : 'rgba(232,232,232,0.55)',
                        border:     category === c ? 'none'    : '1px solid rgba(200,144,26,0.12)',
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div
                ref={dropRef}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all duration-200 mb-5"
                style={{
                  minHeight:  160,
                  border:     `2px dashed ${isDragging ? '#c8901a' : 'rgba(200,144,26,0.25)'}`,
                  background:  isDragging ? 'rgba(200,144,26,0.06)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background:'rgba(200,144,26,0.1)', color:'#c8901a' }}>
                  <FolderOpen size={22} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium font-body" style={{ color:'#e8e8e8' }}>
                    Drop images here or <span style={{ color:'#c8901a' }}>click to browse</span>
                  </p>
                  <p className="text-xs font-body mt-1" style={{ color:'rgba(232,232,232,0.35)' }}>
                    {pending.length}/{MAX_FILES} files selected
                  </p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
              </div>

              {pending.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
                    {pending.map(pf => (
                      <div key={pf.id} className="relative rounded-lg overflow-hidden"
                        style={{ border:'1px solid rgba(200,144,26,0.1)', aspectRatio:'1' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.preview} alt={pf.file.name} className="w-full h-full object-cover" />
                        {pf.status !== 'pending' && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{
                              background: pf.status === 'done'  ? 'rgba(34,197,94,0.75)'
                                        : pf.status === 'error' ? 'rgba(239,68,68,0.75)'
                                        : 'rgba(6,6,8,0.7)',
                            }}>
                            {pf.status === 'uploading' && <Loader2 size={22} className="animate-spin text-white" />}
                            {pf.status === 'done'      && <CheckCircle2 size={22} className="text-white" />}
                            {pf.status === 'error'     && <AlertCircle  size={22} className="text-white" />}
                          </div>
                        )}
                        {pf.status === 'pending' && (
                          <button onClick={() => removeFile(pf.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background:'rgba(0,0,0,0.7)', color:'#fff' }}>
                            <X size={10} />
                          </button>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[9px] font-body truncate"
                          style={{ background:'rgba(0,0,0,0.7)', color:'rgba(255,255,255,0.8)' }}>
                          {pf.file.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pending.some(f => f.status === 'error') && (
                    <div className="mb-4 p-3 rounded-lg text-xs font-body space-y-1"
                      style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5' }}>
                      {pending.filter(f => f.status === 'error').map(f => (
                        <p key={f.id}>✗ {f.file.name}: {f.error}</p>
                      ))}
                    </div>
                  )}

                  {uploadProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-body mb-1.5"
                        style={{ color:'rgba(232,232,232,0.5)' }}>
                        <span>Uploading…</span>
                        <span>{uploadProgress.done} / {uploadProgress.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.08)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background:'linear-gradient(90deg,#c8901a,#e8b024)' }}
                          animate={{ width:`${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                          transition={{ duration:0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleBatchUpload}
                      disabled={uploading || !pending.some(f => f.status === 'pending')}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium font-body rounded-full disabled:opacity-50"
                      style={{ background:'linear-gradient(135deg,#c8901a,#e8b024)', color:'#060608' }}
                    >
                      {uploading
                        ? <><Loader2 size={14} className="animate-spin" />Uploading {pending.filter(f => f.status === 'uploading').length}…</>
                        : <><Upload size={14} />Upload {pending.filter(f => f.status === 'pending').length} Image{pending.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}</>}
                    </button>
                    {pending.some(f => f.status === 'done' || f.status === 'error') && (
                      <button onClick={clearCompleted}
                        className="px-5 py-2.5 text-sm font-body rounded-full border"
                        style={{ borderColor:'rgba(200,144,26,0.2)', color:'rgba(232,232,232,0.5)' }}>
                        Clear Finished
                      </button>
                    )}
                    {!uploading && (
                      <button onClick={() => { clearCompleted(); setPending([]); }}
                        className="px-5 py-2.5 text-sm font-body rounded-full"
                        style={{ color:'rgba(232,232,232,0.35)' }}>
                        Clear All
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER + REORDER BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map(cat => {
            const count = cat === 'All' ? images.length : images.filter(i => i.category === cat).length;
            return (
              <button key={cat} onClick={() => setFilter(cat)}
                className="px-4 py-1.5 text-xs font-medium tracking-wider uppercase font-body transition-all rounded-full"
                style={{
                  background: filter === cat ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
                  color:      filter === cat ? '#060608' : 'rgba(232,232,232,0.5)',
                  border:     filter === cat ? 'none'    : '1px solid rgba(200,144,26,0.12)',
                }}>
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setReorderMode(r => !r)}
          title={reorderMode ? 'Done reordering' : 'Drag images to change their display order'}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium font-body rounded-full transition-all"
          style={{
            background: reorderMode ? 'linear-gradient(135deg,#c8901a,#e8b024)' : 'rgba(255,255,255,0.05)',
            color:      reorderMode ? '#060608' : 'rgba(232,232,232,0.55)',
            border:     reorderMode ? 'none'    : '1px solid rgba(200,144,26,0.12)',
          }}
        >
          <ArrowUpDown size={13} />
          {reorderMode ? 'Done' : 'Reorder'}
          {savingOrder && <Loader2 size={11} className="animate-spin" />}
        </button>
      </div>

      {/* ── GALLERY ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color:'#c8901a' }} />
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-[1.25rem]"
          style={{ border:'1px solid rgba(200,144,26,0.1)' }}>
          <ImageOff size={32} className="mb-3 opacity-30" style={{ color:'#c8901a' }} />
          <p className="font-body" style={{ color:'rgba(232,232,232,0.4)' }}>
            {filter === 'All' ? 'No images yet. Upload your first batch above.' : `No images in ${filter}.`}
          </p>
        </div>

      ) : reorderMode ? (
        /*
         * ── REORDER MODE ─────────────────────────────────────────────────────
         * DragOverlay portals the dragged card to <body>, escaping all
         * stacking contexts. SortableGalleryCard receives disabled=savingOrder
         * so no new drag can begin while a save is in flight.
         */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filtered.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(img => (
                <SortableGalleryCard
                  key={img.id}
                  img={img}
                  disabled={savingOrder}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration:180, easing:'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
            {activeImage ? (
              <div
                className="relative overflow-hidden rounded-[0.75rem] cursor-grabbing select-none"
                style={{
                  border:    '1px solid rgba(200,144,26,0.5)',
                  boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
                  transform: 'scale(1.05)',
                  opacity:    0.96,
                }}
              >
                <CardContent img={activeImage} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

      ) : (
        /* ── NORMAL VIEW ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className="group relative overflow-hidden rounded-[0.75rem]"
              style={{ border:'1px solid rgba(200,144,26,0.1)' }}
            >
              <div className="aspect-square relative">
                <Image
                  src={img.thumbnailUrl || img.imageUrl}
                  alt={img.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
                  unoptimized={img.imageUrl?.startsWith('http')}
                />
                {!img.isPublished && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background:'rgba(0,0,0,0.55)' }}>
                    <EyeOff size={18} style={{ color:'#c8901a' }} />
                  </div>
                )}
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background:'rgba(0,0,0,0.72)' }}
              >
                <button onClick={() => togglePublish(img)} title={img.isPublished ? 'Hide' : 'Publish'}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ background:'rgba(200,144,26,0.18)', color:'#c8901a' }}>
                  {img.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => setConfirmDelete(img)} title="Delete"
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ background:'rgba(239,68,68,0.18)', color:'#ef4444' }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="p-2" style={{ background:'#111' }}>
                <p className="text-xs font-medium truncate font-body" style={{ color:'#e8e8e8' }}>{img.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs font-body" style={{ color:'#c8901a' }}>{img.category}</p>
                  {!img.isPublished && (
                    <span className="text-[10px] font-body" style={{ color:'rgba(232,232,232,0.3)' }}>hidden</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-[1.25rem] overflow-hidden"
              style={{ background: '#111', border: '1px solid rgba(200,144,26,0.2)' }}
            >
              <div className="aspect-[3/2] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={confirmDelete.thumbnailUrl || confirmDelete.imageUrl}
                  alt={confirmDelete.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(17,17,17,0.95) 100%)' }} />
              </div>

              <div className="px-6 pt-1 pb-6">
                <div className="w-10 h-10 -mt-5 mb-3 rounded-full flex items-center justify-center relative"
                  style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Trash2 size={16} style={{ color: '#ef4444' }} />
                </div>

                <h3 className="text-lg font-medium font-body mb-1" style={{ color: '#e8e8e8' }}>
                  Delete this image?
                </h3>
                <p className="text-sm font-body mb-5" style={{ color: 'rgba(232,232,232,0.5)' }}>
                  <span style={{ color: '#c8901a' }}>"{confirmDelete.title}"</span> will be removed from {confirmDelete.category}. You'll have a few seconds to undo right after.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium font-body rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(232,232,232,0.7)', border: '1px solid rgba(200,144,26,0.12)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      performDelete(confirmDelete);
                      setConfirmDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium font-body rounded-full"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}