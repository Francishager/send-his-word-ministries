import Link from 'next/link';
import React from 'react';

export default function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  const nav = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Live', href: '/live' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-indigo-700">
            <img src="/images/logo/shwm_logo.png" alt="Send His Word Ministries" className="h-8 w-auto" />
            <span className="hidden sm:block text-gray-900">Send His Word</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {nav.map((item) => (
            <Link key={item.name} href={item.href} className="text-gray-700 hover:text-indigo-600">
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="md:hidden">
          <button aria-label="Toggle Menu" onClick={() => setOpen((v) => !v)} className="p-2 rounded hover:bg-gray-100">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {nav.map((item) => (
              <Link key={item.name} href={item.href} className="block text-gray-700 hover:text-indigo-600" onClick={() => setOpen(false)}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
