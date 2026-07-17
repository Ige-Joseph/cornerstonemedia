'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';

interface LoginForm { email: string; password: string; }

/* Lens canvas background — standalone, no ThemeProvider needed on login page */
function LensBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf: number; let t = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const motes = Array.from({ length:50 }, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      r: Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.18, vy:(Math.random()-0.5)*0.18,
      alpha: Math.random()*0.4+0.06, gold: Math.random()>0.4,
    }));
    const draw = () => {
      t += 0.004; ctx.clearRect(0,0,canvas.width,canvas.height);
      const cx=canvas.width/2, cy=canvas.height/2;
      const baseR = Math.min(canvas.width,canvas.height)*0.3;
      // Orb glow
      const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,baseR*2.2);
      grd.addColorStop(0,'rgba(200,144,26,0.14)'); grd.addColorStop(0.4,'rgba(180,100,10,0.06)'); grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,baseR*2.2,0,Math.PI*2); ctx.fill();
      // Sphere
      const sph = ctx.createRadialGradient(cx-baseR*0.28,cy-baseR*0.28,baseR*0.04,cx,cy,baseR);
      sph.addColorStop(0,'rgba(255,200,80,0.22)'); sph.addColorStop(0.4,'rgba(120,70,15,0.45)'); sph.addColorStop(1,'rgba(6,6,8,0.92)');
      ctx.beginPath(); ctx.arc(cx,cy,baseR,0,Math.PI*2); ctx.fillStyle=sph; ctx.fill();
      // Border
      ctx.beginPath(); ctx.arc(cx,cy,baseR,0,Math.PI*2);
      ctx.strokeStyle='rgba(200,144,26,0.25)'; ctx.lineWidth=0.8; ctx.stroke();
      // Lens rings
      [0.55,0.72,0.9,1.1,1.3].forEach((f,i) => {
        ctx.beginPath(); ctx.arc(cx,cy,baseR*f*(1+Math.sin(t+i*0.6)*0.01),0,Math.PI*2);
        ctx.strokeStyle=`rgba(200,144,26,${0.06-i*0.008})`; ctx.lineWidth=0.5; ctx.stroke();
      });
      // Crosshair
      const ch=12;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy]) => {
        const px=cx+sx*20, py=cy+sy*20;
        ctx.beginPath(); ctx.moveTo(px,py-sy*ch); ctx.lineTo(px,py); ctx.lineTo(px-sx*ch,py);
        ctx.strokeStyle='rgba(200,144,26,0.3)'; ctx.lineWidth=0.8; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle='rgba(200,144,26,0.5)'; ctx.fill();
      // Motes
      motes.forEach(m => {
        m.x+=m.vx; m.y+=m.vy;
        if(m.x<0)m.x=canvas.width; if(m.x>canvas.width)m.x=0;
        if(m.y<0)m.y=canvas.height; if(m.y>canvas.height)m.y=0;
        ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
        ctx.fillStyle=m.gold?`rgba(200,144,26,${m.alpha})`:`rgba(232,232,232,${m.alpha*0.22})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex:0 }}/>;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState:{ errors } } = useForm<LoginForm>();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/auth/login`, data);
      localStorage.setItem('csm_token', res.data.accessToken);
      localStorage.setItem('csm_user', JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push('/admin/dashboard');
    } catch { toast.error('Invalid credentials. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background:'#060608' }}>
      <LensBg/>
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:1, background:'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 0%, rgba(6,6,8,0.82) 100%)' }}/>

      <div className="relative w-full max-w-md" style={{ zIndex:2 }}>
        {/* Back to site */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-body tracking-wider uppercase mb-10 transition-colors hover:opacity-80"
          style={{ color:'rgba(200,144,26,0.6)' }}>
          <ArrowLeft size={13}/> Back to Website
        </Link>

        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/icons/logo.svg" alt="Corner Stone Media" width={200} height={52} className="h-12 w-auto mx-auto mb-3"/>
          <p className="text-xs tracking-[0.35em] uppercase font-body" style={{ color:'rgba(200,144,26,0.55)' }}>Photographer Admin Portal</p>
        </div>

        {/* Card */}
        <div className="liquid-glass rounded-[1.5rem] p-10" style={{ border:'1px solid rgba(200,144,26,0.12)' }}>
          <h1 className="text-2xl font-heading italic text-white text-center mb-1">Sign In</h1>
          <p className="text-xs text-center mb-8 font-body" style={{ color:'rgba(232,232,232,0.35)' }}>Manage your gallery, bookings &amp; invoices</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-[10px] tracking-widest uppercase mb-2 font-body" style={{ color:'rgba(255,255,255,0.4)' }}>Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(200,144,26,0.5)' }}/>
                <input {...register('email',{required:'Email required',pattern:{value:/^\S+@\S+\.\S+$/,message:'Invalid email'}})}
                  type="email" placeholder="david@cornerstonemedia.com" className="csm-input"/>
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color:'#ef4444' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="mb-8">
              <label className="block text-[10px] tracking-widest uppercase mb-2 font-body" style={{ color:'rgba(255,255,255,0.4)' }}>Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(200,144,26,0.5)' }}/>
                <input {...register('password',{required:'Password required'})}
                  type={showPass?'text':'password'} placeholder="••••••••"
                  className="csm-input" style={{ paddingRight:40 }}/>
                <button type="button" onClick={() => setShowPass(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'rgba(200,144,26,0.5)' }}>
                  {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color:'#ef4444' }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-widest uppercase font-body rounded-full disabled:opacity-60 transition-opacity"
              style={{ background:'linear-gradient(135deg,#c8901a,#e8b024)', color:'#060608' }}>
              {loading ? <><Loader2 size={15} className="animate-spin"/>Signing in...</> : 'Sign In'}
            </button>

            {/* Forgot password link */}
            <div className="text-center mt-4">
              <a href="/admin/forgot-password"
                className="text-xs font-body hover:opacity-80 transition-opacity"
                style={{ color: 'rgba(200,144,26,0.6)' }}>
                Forgot your password?
              </a>
            </div>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-xl" style={{ background:'rgba(200,144,26,0.06)', border:'1px solid rgba(200,144,26,0.12)' }}>
            <p className="text-[11px] font-body text-center" style={{ color:'rgba(200,144,26,0.7)' }}>
              Default: david@cornerstonemedia.com / ChangeMe123!
            </p>
            <p className="text-[10px] font-body text-center mt-1" style={{ color:'rgba(232,232,232,0.3)' }}>
              Run <code className="text-yellow-500/60">npx prisma db seed</code> in the backend first
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
