'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import { Send, Calendar, Mail, User, MessageSquare, ChevronDown, Loader2, Phone } from 'lucide-react';
import axios from 'axios';

const SERVICES = [
  'Wedding Photography','Wedding Videography','Portrait Session',
  'Corporate Event','Birthday / Party','Graduation','Product Photography','Other',
];

interface FormData {
  name: string; email: string; phone: string;
  serviceType: string; preferredDate: string; message: string;
}

export default function BookingSection() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.08 });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      await axios.post(`${API}/bookings`, data);
      setSubmitted(true); reset();
      toast.success('Booking request sent!');
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <section id="booking" className="section-padding relative overflow-hidden" style={{ background: '#060608' }}>
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(200,144,26,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-5 gap-14 items-start">

          {/* Left info */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2">
            <p className="text-xs tracking-[0.35em] uppercase font-medium mb-5 font-body" style={{ color: '#c8901a' }}>
              // Let&apos;s Work Together
            </p>
            <h2 className="font-heading italic text-white leading-[0.9] tracking-[-3px] mb-5"
              style={{ fontSize: 'clamp(2.8rem,6vw,4.5rem)' }}>
              Book a Session
            </h2>
            <div className="gold-divider mb-7" />
            <p className="text-sm font-body font-light leading-relaxed mb-10"
              style={{ color: 'rgba(232,232,232,0.5)' }}>
              Ready to capture your next milestone? Fill out the form and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="space-y-5">
              {[
                { icon: Calendar,      label: 'Availability', value: 'Mon – Sat, 7am – 8pm' },
                { icon: Mail,          label: 'Email',        value: 'david@cornerstonemedia.com' },
                { icon: MessageSquare, label: 'Response',     value: 'Within 24 hours' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="liquid-glass w-10 h-10 rounded-[0.75rem] flex items-center justify-center flex-shrink-0"
                    style={{ color: '#c8901a' }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase font-body" style={{ color: '#c8901a' }}>{label}</p>
                    <p className="text-sm font-body text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3">
            <div className="liquid-glass rounded-[1.5rem] p-8 md:p-10"
              style={{ border: '1px solid rgba(200,144,26,0.1)' }}>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="liquid-glass w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ color: '#c8901a' }}>
                    <Send size={22} />
                  </div>
                  <h3 className="text-2xl font-heading italic text-white mb-3">Thank You!</h3>
                  <p className="text-sm font-body leading-relaxed max-w-sm mx-auto"
                    style={{ color: 'rgba(232,232,232,0.5)' }}>
                    Your request has been received. David will be in touch within 24 hours to confirm details and pricing.
                  </p>
                  <button onClick={() => setSubmitted(false)}
                    className="mt-6 text-xs tracking-wider uppercase border-b font-body"
                    style={{ color: '#c8901a', borderColor: 'rgba(200,144,26,0.35)' }}>
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                        style={{ color: 'rgba(232,232,232,0.4)' }}>Full Name *</label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'rgba(200,144,26,0.5)' }} />
                        <input {...register('name', { required: 'Name required' })}
                          type="text" placeholder="Your full name" className="csm-input" />
                      </div>
                      {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                        style={{ color: 'rgba(232,232,232,0.4)' }}>Email *</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'rgba(200,144,26,0.5)' }} />
                        <input {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                          type="email" placeholder="your@email.com" className="csm-input" />
                      </div>
                      {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                        style={{ color: 'rgba(232,232,232,0.4)' }}>Phone</label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'rgba(200,144,26,0.5)' }} />
                        <input {...register('phone')} type="tel" placeholder="+234 XXX XXX XXXX" className="csm-input" />
                      </div>
                    </div>

                    {/* Service */}
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                        style={{ color: 'rgba(232,232,232,0.4)' }}>Service *</label>
                      <div className="relative">
                        <select {...register('serviceType', { required: 'Select a service' })}
                          className="csm-input"
                          style={{ paddingLeft: 16, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}>
                          <option value="">Select service</option>
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'rgba(200,144,26,0.5)' }} />
                      </div>
                      {errors.serviceType && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.serviceType.message}</p>}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-4">
                    <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                      style={{ color: 'rgba(232,232,232,0.4)' }}>Preferred Date</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'rgba(200,144,26,0.5)' }} />
                      <input {...register('preferredDate')} type="date" className="csm-input" />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-7">
                    <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                      style={{ color: 'rgba(232,232,232,0.4)' }}>Message *</label>
                    <textarea {...register('message', { required: 'Please describe your event', minLength: { value: 15, message: 'Provide more detail' } })}
                      rows={4} placeholder="Tell us about your event, location, number of guests, any requirements..."
                      className="csm-input" style={{ paddingLeft: 16, resize: 'vertical', minHeight: 100 }} />
                    {errors.message && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.message.message}</p>}
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-wider uppercase font-body rounded-full disabled:opacity-60 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                    {submitting
                      ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                      : <><Send size={14} /> Send Booking Request</>}
                  </button>

                  <p className="text-[11px] text-center mt-4 font-body" style={{ color: 'rgba(232,232,232,0.2)' }}>
                    Your data is never shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
