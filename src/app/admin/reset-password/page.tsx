'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Lock, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    // If there's no token in the URL, this page was reached incorrectly
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) { setError('Invalid reset link — please request a new one.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword: password });
      setDone(true);
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/admin/login'), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,144,26,0.2)',
    color: '#e8e8e8',
    width: '100%',
    padding: '12px 40px 12px 16px',
    fontSize: '14px',
    fontFamily: 'Barlow, sans-serif',
    outline: 'none',
    borderRadius: '0.5rem',
  } as React.CSSProperties;
  const onFocus = (e: any) => { e.target.style.borderColor = '#c8901a'; e.target.style.background = 'rgba(200,144,26,0.06)'; };
  const onBlur  = (e: any) => { e.target.style.borderColor = 'rgba(200,144,26,0.2)'; e.target.style.background = 'rgba(255,255,255,0.04)'; };

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
            {done ? 'Password reset!' : 'Set new password'}
          </h1>
        </div>

        <div className="p-8 rounded-[1.5rem]"
          style={{ background: '#111', border: '1px solid rgba(200,144,26,0.12)' }}>

          {done ? (
            /* ── Success state ─────────────────────────────────────── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(34,197,94,0.1)' }}>
                <CheckCircle2 size={26} style={{ color: '#22c55e' }} />
              </div>
              <p className="text-sm font-body mb-2" style={{ color: '#e8e8e8' }}>
                Password updated successfully
              </p>
              <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.5)' }}>
                Redirecting you to the login page...
              </p>
            </div>
          ) : !token ? (
            /* ── No token state ────────────────────────────────────── */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <XCircle size={26} style={{ color: '#ef4444' }} />
              </div>
              <p className="text-sm font-body mb-2" style={{ color: '#e8e8e8' }}>
                Invalid reset link
              </p>
              <p className="text-xs font-body mb-5" style={{ color: 'rgba(232,232,232,0.5)' }}>
                This link is missing a reset token. Please request a new one.
              </p>
              <Link href="/admin/forgot-password"
                className="text-xs font-body underline"
                style={{ color: '#c8901a' }}>
                Request new reset link
              </Link>
            </div>
          ) : (
            /* ── Form state ────────────────────────────────────────── */
            <>
              <p className="text-sm font-body mb-6" style={{ color: 'rgba(232,232,232,0.5)' }}>
                Choose a strong password — minimum 8 characters.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* New password */}
                <div className="mb-4">
                  <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                    style={{ color: 'rgba(232,232,232,0.4)' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={inp}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(200,144,26,0.5)' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="mb-5">
                  <label className="block text-[10px] tracking-widest uppercase mb-2 font-body"
                    style={{ color: 'rgba(232,232,232,0.4)' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={inp}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowConf(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(200,144,26,0.5)' }}>
                      {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg text-xs font-body"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                    {error}
                    {(error.includes('expired') || error.includes('invalid')) && (
                      <div className="mt-2">
                        <Link href="/admin/forgot-password"
                          className="underline" style={{ color: '#c8901a' }}>
                          Request a new link →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold font-body tracking-wider rounded-full disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Resetting...</>
                    : <><Lock size={15} /> Reset Password</>}
                </button>
              </form>
            </>
          )}
        </div>

        {!done && (
          <div className="text-center mt-6">
            <Link href="/admin/login"
              className="text-xs font-body hover:opacity-80 transition-opacity"
              style={{ color: 'rgba(232,232,232,0.4)' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams requires Suspense in Next.js 14 App Router
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060608' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#c8901a' }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
