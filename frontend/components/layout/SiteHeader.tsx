import Link from 'next/link';
import React from 'react';
import { useDonate } from '@/components/donate/DonateModalContext';

export default function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const donate = useDonate();
  // Live countdown state
  const [now, setNow] = React.useState<Date>(() => new Date());

  // Configurable via env
  const liveStartIso = process.env.NEXT_PUBLIC_LIVE_START_ISO || '';
  const liveDurationMin = Number(process.env.NEXT_PUBLIC_LIVE_DURATION_MIN || '120');

  const getNextSunday10am = () => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const daysUntilSunday = (7 - day) % 7;
    const next = new Date(d);
    next.setDate(d.getDate() + (daysUntilSunday === 0 && d.getHours() >= 10 ? 7 : daysUntilSunday));
    next.setHours(10, 0, 0, 0);
    return next;
  };

  const liveStart = React.useMemo(() => {
    if (liveStartIso) {
      const t = new Date(liveStartIso);
      if (!isNaN(t.getTime())) return t;
    }
    return getNextSunday10am();
  }, [liveStartIso]);

  const liveEnd = React.useMemo(() => new Date(liveStart.getTime() + liveDurationMin * 60 * 1000), [liveStart, liveDurationMin]);

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const msUntil = liveStart.getTime() - now.getTime();
  const isLiveNow = now >= liveStart && now <= liveEnd;
  const countdown = (() => {
    if (msUntil <= 0) return 'Now';
    const totalSeconds = Math.floor(msUntil / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
  })();

  const nav = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Live', href: '/live' },
    { name: 'Blog', href: '/blog' },
    { name: 'Testimony', href: '/testimony' },
    { name: 'Give', href: '/give' },
    { name: 'Donate', href: '/donate' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-indigo-700">
            <img
              src="/images/logo/shwm_logo.png"
              alt="Send His Word Ministries"
              className="h-8 w-auto"
            />
            <span className="hidden sm:block text-gray-900">Send His Word</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {nav.map((item) => {
            const isDonate = item.name === 'Give' || item.name === 'Donate';
            if (isDonate) {
              return (
                <button
                  key={item.name}
                  onClick={() => donate.open({})}
                  className="relative text-gray-700 hover:text-indigo-600"
                >
                  {item.name}
                </button>
              );
            }
            return (
              <Link key={item.name} href={item.href} className="relative text-gray-700 hover:text-indigo-600">
                {item.name}
                {item.name === 'Live' && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLiveNow ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isLiveNow ? 'LIVE' : countdown}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="md:hidden">
          <button
            aria-label="Toggle Menu"
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {nav.map((item) => {
              const isDonate = item.name === 'Give' || item.name === 'Donate';
              if (isDonate) {
                return (
                  <button
                    key={item.name}
                    onClick={() => { donate.open({}); setOpen(false); }}
                    className="flex w-full items-center justify-between text-left text-gray-700 hover:text-indigo-600"
                  >
                    <span>{item.name}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between text-gray-700 hover:text-indigo-600"
                  onClick={() => setOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.name === 'Live' && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLiveNow ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isLiveNow ? 'LIVE' : countdown}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
