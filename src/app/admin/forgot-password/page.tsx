'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError('');
    try {
      setLoading(true);
      await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch {
      // The endpoint always returns 200 by design — if we get here it's
      // a genuine network/server error, not "email not found"
      setError('Something went wrong. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,144,26,0.2)',
    color: '#e8e8e8',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: 'Barlow, sans-serif',
    outline: 'none',
    borderRadius: '0.5rem',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#060608' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(200,144,26,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.35em] uppercase font-body mb-2" style={{ color: '#c8901a' }}>
            Corner Stone Media
          </p>
          <h1 className="font-heading italic text-white" style={{ fontSize: 28 }}>
            {sent ? 'Check your email' : 'Forgot password?'}
          </h1>
        </div>

        <div className="p-8 rounded-[1.5rem]"
          style={{ background: '#111', border: '1px solid rgba(200,144,26,0.12)' }}>

          {sent ? (
            /* ── Success state ─────────────────────────────────────── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(200,144,26,0.1)' }}>
                <CheckCircle2 size={26} style={{ color: '#c8901a' }} />
              </div>
              <p className="text-sm font-body mb-2" style={{ color: '#e8e8e8' }}>
                Reset link sent
              </p>
              <p className="text-xs font-body leading-relaxed mb-6" style={{ color: 'rgba(232,232,232,0.5)' }}>
                If <strong style={{ color: '#e8e8e8' }}>{email}</strong> is registered,
                you'll receive a reset link within a few minutes. Check your spam folder
                if you don't see it.
              </p>
              <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                The link expires in <strong style={{ color: '#e8e8e8' }}>1 hour</strong>.
              </p>
            </div>
          ) : (
            /* ── Form state ────────────────────────────────────────── */
            <>
              <p className="text-sm font-body mb-6" style={{ color: 'rgba(232,232,232,0.5)' }}>
                Enter your admin email and we'll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                    style={{ color: 'rgba(232,232,232,0.4)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(200,144,26,0.5)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="david@cornerstonemedia.com"
                      autoComplete="email"
                      style={{ ...inp, paddingLeft: '36px' }}
                      onFocus={e => { e.target.style.borderColor = '#c8901a'; e.target.style.background = 'rgba(200,144,26,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(200,144,26,0.2)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                    />
                  </div>
                  {error && (
                    <p className="text-xs mt-2 font-body" style={{ color: '#ef4444' }}>{error}</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold font-body tracking-wider rounded-full disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                    : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link href="/admin/login"
            className="flex items-center justify-center gap-2 text-xs font-body hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(232,232,232,0.4)' }}>
            <ArrowLeft size={12} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
