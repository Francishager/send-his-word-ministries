import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export default function AdminLayout({ title = 'Admin', children }: { title?: string; children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [perms, setPerms] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me/`, { credentials: 'include' });
        if (!res.ok) return;
        const j = await res.json();
        if (j && typeof j.permissions === 'object') setPerms(j.permissions);
      } catch {}
    })();
  }, []);

  const can = (key: string) => !!perms[key] || false;

  const rawNav = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/prepared', label: 'Prepared', icon: '🧾' },
    { href: '/admin/contacts', label: 'Contacts', icon: '✉️' },
    { href: '/admin/users', label: 'Users', icon: '👤', require: 'users_manage' },
    { href: '/admin/roles', label: 'Roles', icon: '🔐', require: 'roles_manage' },
    { href: '/admin/system', label: 'System', icon: '⚙️', require: 'reporting_read' },
  ];
  const nav = rawNav.filter((n: any) => !n.require || can(n.require));

  const parts = router.pathname.split('/').filter(Boolean);
  const crumbs = parts.map((p, i) => ({
    href: '/' + parts.slice(0, i + 1).join('/'),
    label: p.charAt(0).toUpperCase() + p.slice(1),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all bg-white border-r hidden md:block`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className={`text-lg font-semibold ${collapsed ? 'sr-only' : ''}`}>Admin Portal</span>
          <button aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-gray-800">
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`group relative flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`} aria-label={item.label} title={collapsed ? item.label : undefined}>
                <span aria-hidden>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-64 bg-white border-r p-3">
            <div className="h-12 flex items-center justify-between mb-2">
              <span className="text-base font-semibold">Admin Portal</span>
              <button className="text-gray-600" onClick={()=>setMobileOpen(false)}>✕</button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const active = router.pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="text-xs text-gray-500">
              <nav className="flex items-center gap-1">
                <Link href="/admin" className="hover:underline">Admin</Link>
                {crumbs.slice(1).map((c, i) => (
                  <span key={c.href} className="flex items-center gap-1">
                    <span>/</span>
                    <Link href={c.href} className="hover:underline">{c.label}</Link>
                  </span>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <button className="md:hidden rounded border px-3 py-1" onClick={()=>setMobileOpen(true)}>Menu</button>
            <a href="/" className="hover:text-gray-900">View Site</a>
          </div>
        </header>
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
