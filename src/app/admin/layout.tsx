'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Images,
  CalendarCheck,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Settings,
  Quote
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/gallery', label: 'Gallery', icon: Images },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/invoices', label: 'Invoices', icon: FileText },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount] = useState(0);

  // PUBLIC ROUTES (CRITICAL FIX)
  const publicRoutes = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
  ];

  useEffect(() => {
    // Allow public routes to pass freely
    if (publicRoutes.includes(pathname)) return;

    const token = localStorage.getItem('csm_token');

    // If no token → redirect ONLY for protected routes
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    // Load user safely
    const u = localStorage.getItem('csm_user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error('Invalid user JSON');
        localStorage.removeItem('csm_user');
      }
    }
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('csm_token');
    localStorage.removeItem('csm_user');
    router.replace('/admin/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: '#09090e' }}>
      <div className="p-6 pb-5" style={{ borderBottom: '1px solid rgba(200,144,26,0.08)' }}>
        <Image src="/icons/logo.svg" alt="CSM" width={160} height={42} className="h-9 w-auto" />
        <p className="text-[10px] mt-1.5 font-body tracking-[0.35em] uppercase"
          style={{ color: 'rgba(200,144,26,0.45)' }}>
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium font-body rounded-xl"
              style={{
                background: active ? 'rgba(200,144,26,0.1)' : 'transparent',
                color: active ? '#e8b024' : 'rgba(232,232,232,0.45)',
                borderLeft: active ? '2px solid #c8901a' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {label}
              {active && <ChevronRight size={12} className="ml-auto" />}
              {label === 'Bookings' && pendingCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#c8901a', color: '#060608' }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid rgba(200,144,26,0.08)' }}>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2.5 mb-1 text-sm font-body rounded-xl"
          style={{ color: 'rgba(200,144,26,0.6)' }}
        >
          <ExternalLink size={13} /> View Public Site
        </Link>

        {user && (
          <div className="flex items-center gap-3 px-4 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body"
              style={{
                background: 'linear-gradient(135deg,#c8901a,#e8b024)',
                color: '#060608',
              }}
            >
              {user.name?.charAt(0) || 'A'}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium truncate font-body" style={{ color: '#e8e8e8' }}>
                {user.name}
              </p>
              <p className="text-[10px] truncate font-body" style={{ color: 'rgba(232,232,232,0.35)' }}>
                {user.role}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-body rounded-xl"
          style={{ color: 'rgba(232,232,232,0.35)' }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  // Allow login page to bypass layout auth completely
  if (pathname === '/admin/login') return <>{children}</>;
  if (publicRoutes.includes(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-screen" style={{ background: '#060608' }}>
      <aside
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full"
        style={{ borderRight: '1px solid rgba(200,144,26,0.07)' }}
      >
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.78)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 z-10"
              style={{ color: '#c8901a' }}
            >
              <X size={18} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 h-16"
          style={{
            background: 'rgba(6,6,8,0.95)',
            borderBottom: '1px solid rgba(200,144,26,0.07)',
          }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: '#c8901a' }}>
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs uppercase font-body" style={{ color: 'rgba(232,232,232,0.3)' }}>
              {NAV.find((n) => pathname.startsWith(n.href))?.label || 'Admin'}
            </span>
          </div>

          <div className="text-xs font-body hidden sm:block" style={{ color: 'rgba(232,232,232,0.3)' }}>
            {user?.email}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}