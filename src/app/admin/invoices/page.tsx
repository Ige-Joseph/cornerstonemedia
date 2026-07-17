'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Trash2, Download, Send, Loader2,
  ChevronDown, PlusCircle, X,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#e8b024', SENT: '#6366f1', PAID: '#22c55e',
  OVERDUE: '#ef4444', CANCELLED: '#888',
};

interface InvoiceItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}
interface InvoiceFormData {
  clientName:  string;
  clientEmail: string;
  bookingId:   string;
  dueDate:     string;
  notes:       string;
  tax:         number;
  items:       InvoiceItemForm[];
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [creating, setCreating]         = useState(false);
  const [downloading, setDownloading]   = useState<string | null>(null);
  const [emailing, setEmailing]         = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      tax: 0,
      clientName: '', clientEmail: '', bookingId: '', dueDate: '', notes: '',
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchItems = watch('items');
  const watchTax   = watch('tax');
  const subtotal   = watchItems?.reduce((a, i) => a + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0) || 0;
  const total      = subtotal + (Number(watchTax) || 0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/invoices`, { headers: authHeaders() });
      setInvoices(res.data);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setCreating(true);
      const payload = {
        clientName:  data.clientName,
        clientEmail: data.clientEmail,
        bookingId:   data.bookingId || undefined,
        dueDate:     data.dueDate   || undefined,
        notes:       data.notes     || undefined,
        tax:         Number(data.tax) || 0,
        items: data.items.map(i => ({
          description: i.description,
          quantity:    Number(i.quantity),
          unitPrice:   Number(i.unitPrice),
        })),
      };
      await axios.post(`${API_URL}/invoices`, payload, { headers: authHeaders() });
      toast.success('Invoice created!');
      reset();
      setShowCreate(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to create invoice'));
    } finally { setCreating(false); }
  };

  const downloadPdf = async (inv: any) => {
    try {
      setDownloading(inv.id);
      const res = await axios.get(`${API_URL}/invoices/${inv.id}/pdf`, {
        headers: { ...authHeaders(), Accept: 'application/pdf' },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = `${inv.invoiceNo}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  const emailToClient = async (inv: any) => {
    if (!confirm(`Email invoice ${inv.invoiceNo} to ${inv.clientEmail}?`)) return;
    try {
      setEmailing(inv.id);
      await axios.post(`${API_URL}/invoices/${inv.id}/email`, {}, { headers: authHeaders() });
      toast.success('Invoice emailed to client');
      load();
    } catch { toast.error('Email failed — check SMTP config'); }
    finally { setEmailing(null); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_URL}/invoices/${id}`, { status }, { headers: authHeaders() });
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  const deleteInvoice = (inv: any) => {
    // Optimistic removal
    setPendingDelete(inv.id);
    setInvoices(prev => prev.filter(i => i.id !== inv.id));
    if (expanded === inv.id) setExpanded(null);

    let undone = false;

    toast(
      (t) => (
        <div style={{ fontFamily: 'Barlow, sans-serif' }}>
          <p style={{ color: '#e8e8e8', fontSize: 13, marginBottom: 8 }}>
            Delete{' '}
            <span style={{ color: '#c8901a', fontWeight: 600 }}>{inv.invoiceNo}</span>?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                undone = true;
                setInvoices(prev => {
                  const exists = prev.some(i => i.id === inv.id);
                  return exists ? prev : [inv, ...prev];
                });
                setPendingDelete(null);
                toast.dismiss(t.id);
              }}
              style={{
                background: 'rgba(200,144,26,0.15)',
                border: '1px solid rgba(200,144,26,0.35)',
                color: '#c8901a',
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              Undo
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                if (undone) return;
                try {
                  setDeletingId(inv.id);
                  await axios.delete(`${API_URL}/invoices/${inv.id}`, { headers: authHeaders() });
                  toast.success('Invoice deleted');
                } catch {
                  setInvoices(prev => {
                    const exists = prev.some(i => i.id === inv.id);
                    return exists ? prev : [inv, ...prev];
                  });
                  toast.error('Delete failed');
                } finally {
                  setDeletingId(null);
                  setPendingDelete(null);
                }
              }}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#ef4444',
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: '#1a1a1a',
          border: '1px solid rgba(200,144,26,0.2)',
          borderRadius: '0.75rem',
          padding: '12px 16px',
        },
      }
    );

    // Auto-fire DELETE after toast expires if not undone
    setTimeout(async () => {
      if (undone) return;
      try {
        setDeletingId(inv.id);
        await axios.delete(`${API_URL}/invoices/${inv.id}`, { headers: authHeaders() });
      } catch {
        setInvoices(prev => {
          const exists = prev.some(i => i.id === inv.id);
          return exists ? prev : [inv, ...prev];
        });
        toast.error('Delete failed');
      } finally {
        setDeletingId(null);
        setPendingDelete(null);
      }
    }, 5100);
  };

  const inp = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,144,26,0.15)',
    color: '#e8e8e8',
    padding: '9px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    borderRadius: '0.5rem',
    fontFamily: 'Barlow, sans-serif',
  } as React.CSSProperties;

  const onFocus = (e: any) => { e.target.style.borderColor = '#c8901a'; e.target.style.background = 'rgba(200,144,26,0.06)'; };
  const onBlur  = (e: any) => { e.target.style.borderColor = 'rgba(200,144,26,0.15)'; e.target.style.background = 'rgba(255,255,255,0.04)'; };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#e8e8e8', fontSize: 30, fontWeight: 300, fontStyle: 'italic' }}>
            Invoices
          </h1>
          <p className="text-sm mt-0.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
            {invoices.length} total · {invoices.filter(i => i.status === 'PAID').length} paid ·{' '}
            {invoices.filter(i => i.status === 'DRAFT').length} drafts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-body tracking-wider rounded-full"
          style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6 mb-6 rounded-[1.25rem]"
            style={{ background: '#111', border: '1px solid rgba(200,144,26,0.15)' }}>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium font-body" style={{ color: '#c8901a' }}>Create Invoice</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'rgba(232,232,232,0.4)' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Client info row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>Client Name *</label>
                  <input {...register('clientName', { required: 'Required' })} placeholder="Full name" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  {errors.clientName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.clientName.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>Client Email *</label>
                  <input {...register('clientEmail', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                    type="email" placeholder="email@example.com" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  {errors.clientEmail && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.clientEmail.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>Due Date</label>
                  <input {...register('dueDate')} type="date" style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>Tax / VAT (₦)</label>
                  <input {...register('tax', { valueAsNumber: true })} type="number" min="0" step="0.01" placeholder="0" style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Line items */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] tracking-widest uppercase font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>
                    Line Items *
                  </label>
                  <button type="button" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                    className="flex items-center gap-1 text-xs font-body" style={{ color: '#c8901a' }}>
                    <PlusCircle size={13} /> Add Item
                  </button>
                </div>

                {/* Header row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 mb-1 px-1">
                  {['Description', 'Qty', 'Unit Price (₦)', ''].map((h, i) => (
                    <div key={i} className={`text-[10px] uppercase tracking-wider font-body ${i === 0 ? 'col-span-6' : i === 3 ? 'col-span-1' : 'col-span-2'}`}
                      style={{ color: 'rgba(232,232,232,0.3)' }}>{h}</div>
                  ))}
                </div>

                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-12 sm:col-span-6">
                        <input {...register(`items.${idx}.description`, { required: 'Required' })}
                          placeholder="Service description" style={inp} onFocus={onFocus} onBlur={onBlur} />
                        {errors.items?.[idx]?.description && (
                          <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>Required</p>
                        )}
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input {...register(`items.${idx}.quantity`, { required: true, valueAsNumber: true, min: { value: 1, message: 'Min 1' } })}
                          type="number" min="1" placeholder="1" style={inp} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <input {...register(`items.${idx}.unitPrice`, { required: true, valueAsNumber: true, min: { value: 0, message: 'Min 0' } })}
                          type="number" min="0" step="0.01" placeholder="0" style={inp} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end pt-2">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(idx)} style={{ color: '#ef4444' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals preview */}
                <div className="mt-3 text-right text-sm space-y-0.5">
                  <p style={{ color: 'rgba(232,232,232,0.5)' }}>
                    Subtotal: <span style={{ color: '#e8e8e8' }}>₦{subtotal.toLocaleString()}</span>
                  </p>
                  {Number(watchTax) > 0 && (
                    <p style={{ color: 'rgba(232,232,232,0.5)' }}>
                      Tax: <span style={{ color: '#e8e8e8' }}>₦{Number(watchTax).toLocaleString()}</span>
                    </p>
                  )}
                  <p className="font-semibold font-body" style={{ color: '#c8901a' }}>
                    Total: ₦{total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.45)' }}>Notes (optional)</label>
                <textarea {...register('notes')} rows={2}
                  placeholder="Payment instructions, bank details, etc."
                  style={{ ...inp, resize: 'vertical' }} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium font-body rounded-full disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><FileText size={14} /> Create Invoice</>}
                </button>
                <button type="button" onClick={() => { reset(); setShowCreate(false); }}
                  className="px-5 py-2.5 text-sm border font-body rounded-full"
                  style={{ borderColor: 'rgba(200,144,26,0.2)', color: 'rgba(232,232,232,0.5)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: '#c8901a' }} /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 rounded-[1.25rem]" style={{ border: '1px solid rgba(200,144,26,0.1)' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-30" style={{ color: '#c8901a' }} />
          <p className="font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>No invoices yet. Create your first invoice above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <motion.div key={inv.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-[1rem]" style={{ background: '#111', border: '1px solid rgba(200,144,26,0.1)' }}>

              {/* Summary row */}
              <button onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                className="w-full flex items-center gap-4 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-semibold font-body" style={{ color: '#c8901a' }}>{inv.invoiceNo}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium"
                      style={{ background: `${STATUS_COLOR[inv.status] || '#888'}18`, color: STATUS_COLOR[inv.status] || '#888' }}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 font-body" style={{ color: '#e8e8e8' }}>{inv.clientName}</p>
                  <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>{inv.clientEmail}</p>
                </div>
                <div className="text-right mr-2 flex-shrink-0">
                  <p className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#c8901a' }}>
                    ₦{Number(inv.total).toLocaleString()}
                  </p>
                  <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
                    {new Date(inv.createdAt).toLocaleDateString('en-GB')}
                  </p>
                  {inv.dueDate && (
                    <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
                      Due: {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
                <ChevronDown size={14} style={{
                  color: '#c8901a', flexShrink: 0,
                  transform: expanded === inv.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
              </button>

              {/* Expanded detail */}
              {expanded === inv.id && (
                <div className="px-4 pb-5" style={{ borderTop: '1px solid rgba(200,144,26,0.08)' }}>
                  {/* Items table */}
                  <div className="mt-4 mb-4 overflow-x-auto">
                    <table className="w-full text-xs" style={{ borderCollapse: 'collapse', minWidth: 400 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(200,144,26,0.12)' }}>
                          {['Description','Qty','Unit Price','Total'].map(h => (
                            <th key={h} className="text-left pb-2 pr-4 font-medium tracking-wider uppercase font-body"
                              style={{ color: 'rgba(232,232,232,0.4)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(inv.items as any[]).map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td className="py-2 pr-4 font-body" style={{ color: '#e8e8e8' }}>{item.description}</td>
                            <td className="py-2 pr-4 font-body" style={{ color: 'rgba(232,232,232,0.6)' }}>{item.quantity}</td>
                            <td className="py-2 pr-4 font-body" style={{ color: 'rgba(232,232,232,0.6)' }}>₦{Number(item.unitPrice).toLocaleString()}</td>
                            <td className="py-2 font-body" style={{ color: '#c8901a' }}>₦{(item.quantity * item.unitPrice).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right mt-2 text-sm space-y-0.5">
                      <p className="font-body" style={{ color: 'rgba(232,232,232,0.5)' }}>Subtotal: ₦{Number(inv.subtotal).toLocaleString()}</p>
                      {Number(inv.tax) > 0 && <p className="font-body" style={{ color: 'rgba(232,232,232,0.5)' }}>Tax: ₦{Number(inv.tax).toLocaleString()}</p>}
                      <p className="font-semibold font-body" style={{ color: '#c8901a' }}>Total: ₦{Number(inv.total).toLocaleString()}</p>
                    </div>
                  </div>

                  {inv.notes && (
                    <p className="text-xs mb-4 px-3 py-2 font-body rounded-lg"
                      style={{ background: 'rgba(200,144,26,0.06)', color: 'rgba(232,232,232,0.6)', borderLeft: '2px solid #c8901a' }}>
                      {inv.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => downloadPdf(inv)} disabled={downloading === inv.id}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium font-body rounded-full disabled:opacity-60"
                      style={{ background: 'rgba(200,144,26,0.12)', color: '#c8901a', border: '1px solid rgba(200,144,26,0.25)' }}>
                      {downloading === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      Download PDF
                    </button>
                    <button onClick={() => emailToClient(inv)} disabled={emailing === inv.id}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium font-body rounded-full disabled:opacity-60"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                      {emailing === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Email to Client
                    </button>
                    <button
                      onClick={() => deleteInvoice(inv)}
                      disabled={deletingId === inv.id || pendingDelete === inv.id}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium font-body rounded-full disabled:opacity-60"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                      {(deletingId === inv.id || pendingDelete === inv.id)
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />}
                      Delete
                    </button>

                    {/* Status updater */}
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>Status:</span>
                      {(['DRAFT','SENT','PAID','OVERDUE'] as const).map(s => (
                        <button key={s} onClick={() => updateStatus(inv.id, s)}
                          className="text-xs px-2.5 py-1 font-body rounded-full transition-all"
                          style={{
                            background: inv.status === s ? `${STATUS_COLOR[s]}22` : 'rgba(255,255,255,0.04)',
                            color: inv.status === s ? STATUS_COLOR[s] : 'rgba(232,232,232,0.4)',
                            border: `1px solid ${inv.status === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.06)'}`,
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}