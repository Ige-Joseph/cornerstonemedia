'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, User, Mail, Shield, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function authHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('csm_token') : '';
  return { Authorization: `Bearer ${t}` };
}

interface PasswordForm {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

export default function AdminSettingsPage() {
  const [user, setUser]           = useState<any>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('csm_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<PasswordForm>();

  const newPass = watch('newPassword');

  const onSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (data.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    try {
      setSaving(true);
      await axios.patch(
        `${API_URL}/auth/change-password`,
        { currentPassword: data.currentPassword, newPassword: data.newPassword },
        { headers: authHeaders() },
      );
      setDone(true);
      reset();
      toast.success('Password changed successfully');
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Failed to change password — check your current password');
    } finally { setSaving(false); }
  };

  const inp = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,144,26,0.15)',
    color: '#e8e8e8',
    width: '100%',
    padding: '11px 40px 11px 14px',
    fontSize: '14px',
    fontFamily: 'Barlow, sans-serif',
    outline: 'none',
    borderRadius: '0.5rem',
  } as React.CSSProperties;
  const onFocus = (e: any) => { e.target.style.borderColor = '#c8901a'; e.target.style.background = 'rgba(200,144,26,0.06)'; };
  const onBlur  = (e: any) => { e.target.style.borderColor = 'rgba(200,144,26,0.15)'; e.target.style.background = 'rgba(255,255,255,0.04)'; };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#e8e8e8', fontSize: 30, fontWeight: 300, fontStyle: 'italic' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
          Manage your account and security preferences
        </p>
      </div>

      {/* Account info card */}
      <div className="p-6 rounded-[1.25rem] mb-6" style={{ background: '#111', border: '1px solid rgba(200,144,26,0.1)' }}>
        <h2 className="text-sm font-semibold font-body tracking-widest uppercase mb-5" style={{ color: '#c8901a' }}>
          Account Information
        </h2>
        <div className="space-y-4">
          {[
            { icon: User,   label: 'Name',  value: user?.name  || '—' },
            { icon: Mail,   label: 'Email', value: user?.email || '—' },
            { icon: Shield, label: 'Role',  value: user?.role  || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,144,26,0.08)', color: '#c8901a' }}>
                <Icon size={15} />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>{label}</p>
                <p className="text-sm font-body" style={{ color: '#e8e8e8' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change password card */}
      <div className="p-6 rounded-[1.25rem]" style={{ background: '#111', border: '1px solid rgba(200,144,26,0.1)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(200,144,26,0.08)', color: '#c8901a' }}>
            <Lock size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-body tracking-widest uppercase" style={{ color: '#c8901a' }}>
              Change Password
            </h2>
            <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.35)' }}>
              Minimum 8 characters
            </p>
          </div>
        </div>

        {done ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
            <p className="text-sm font-body" style={{ color: '#22c55e' }}>Password changed successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                Current Password *
              </label>
              <div className="relative">
                <input {...register('currentPassword', { required: 'Required' })}
                  type={showCurrent ? 'text' : 'password'} placeholder="••••••••"
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(200,144,26,0.5)' }}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.currentPassword.message}</p>}
            </div>

            {/* New password */}
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                New Password *
              </label>
              <div className="relative">
                <input {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                  type={showNew ? 'text' : 'password'} placeholder="••••••••"
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(200,144,26,0.5)' }}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.newPassword.message}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5 font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
                Confirm New Password *
              </label>
              <div className="relative">
                <input {...register('confirmPassword', {
                    required: 'Required',
                    validate: v => v === newPass || 'Passwords do not match',
                  })}
                  type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(200,144,26,0.5)' }}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium font-body rounded-full disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#c8901a,#e8b024)', color: '#060608' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Lock size={14} /> Change Password</>}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* API info */}
      <div className="mt-6 p-5 rounded-[1rem]" style={{ background: 'rgba(200,144,26,0.04)', border: '1px solid rgba(200,144,26,0.1)' }}>
        <p className="text-[10px] tracking-widest uppercase font-body mb-2" style={{ color: 'rgba(200,144,26,0.6)' }}>
          Developer
        </p>
        <p className="text-xs font-body" style={{ color: 'rgba(232,232,232,0.4)' }}>
          By:
          <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#e8b024' }}>
            Joseph Ige
          </code>
        </p>
        {/* <p className="text-xs font-body mt-1" style={{ color: 'rgba(232,232,232,0.4)' }}>
          Swagger Docs:{' '}
          <a href={API_URL.replace('/api/v1', '/api/docs')} target="_blank" rel="noopener noreferrer"
            className="hover:opacity-80" style={{ color: '#c8901a', textDecoration: 'underline' }}>
            {API_URL.replace('/api/v1', '/api/docs')}
          </a>
        </p> */}
      </div>
    </div>
  );
}
