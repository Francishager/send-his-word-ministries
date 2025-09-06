import { ReactNode } from 'react';
import Head from 'next/head';
import SiteHeader from './SiteHeader';
import React from 'react';
import { toast } from 'react-hot-toast';
import useNextService from '@/hooks/useNextService';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function MainLayout({ 
  children, 
  title = 'Send His Word Ministries',
  description = 'A digital ministry platform for worship, prayer, and community engagement',
  className = '' 
}: MainLayoutProps) {
  // Small countdown ticker when the next service is within the next hour
  const { service, startDate, isLive } = useNextService();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const msRemaining = startDate ? Math.max(0, startDate.getTime() - now.getTime()) : undefined;
  const withinHour = !!msRemaining && msRemaining <= 60 * 60 * 1000 && !isLive;
  const dd = (n: number) => n.toString().padStart(2, '0');
  const days = msRemaining ? Math.floor(msRemaining / (1000 * 60 * 60 * 24)) : 0;
  const hours = msRemaining ? Math.floor((msRemaining / (1000 * 60 * 60)) % 24) : 0;
  const minutes = msRemaining ? Math.floor((msRemaining / (1000 * 60)) % 60) : 0;
  const seconds = msRemaining ? Math.floor((msRemaining / 1000) % 60) : 0;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {withinHour && (
        <div className="w-full bg-indigo-600 text-white text-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Starting Soon</span>
              <span className="opacity-90">{service?.title || 'Upcoming Service'}</span>
            </div>
            <a href="/live" className="inline-flex items-center gap-2">
              <span className="rounded bg-white/10 px-2 py-1">{dd(days)}d</span>
              <span className="rounded bg-white/10 px-2 py-1">{dd(hours)}h</span>
              <span className="rounded bg-white/10 px-2 py-1">{dd(minutes)}m</span>
              <span className="rounded bg-white/10 px-2 py-1">{dd(seconds)}s</span>
            </a>
          </div>
        </div>
      )}

      {/* Global navbar */}
      <SiteHeader />

      <main className={`flex-grow ${className}`}>
        {children}
      </main>

      <footer className="bg-gray-900 text-white py-10 mt-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold">Send His Word Ministries</h3>
            <p className="text-gray-400 mt-2">Connecting hearts to God's word.</p>
            <div className="flex items-center gap-4 mt-4">
              <a aria-label="Facebook" href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.48 17.52 2 12 2S2 6.48 2 12.06C2 17.08 5.66 21.2 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.55v1.87h2.78l-.44 2.9h-2.34V22C18.34 21.2 22 17.08 22 12.06Z"/></svg>
              </a>
              <a aria-label="Twitter" href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.89-.53 1.57-1.38 1.89-2.4-.83.49-1.75.84-2.73 1.03C18.4 4.5 17.21 4 15.9 4c-2.5 0-4.53 2.01-4.53 4.5 0 .35.04.7.12 1.03-3.76-.19-7.1-1.98-9.33-4.7-.39.66-.61 1.43-.61 2.25 0 1.55.81 2.93 2.05 3.73-.75-.02-1.46-.23-2.08-.57v.06c0 2.17 1.57 3.99 3.65 4.41-.38.1-.78.15-1.19.15-.29 0-.57-.03-.84-.08.57 1.78 2.23 3.08 4.19 3.12-1.54 1.19-3.48 1.9-5.59 1.9-.36 0-.72-.02-1.07-.06 1.99 1.27 4.36 2.01 6.9 2.01 8.28 0 12.81-6.77 12.81-12.64 0-.2-.01-.41-.02-.61.88-.63 1.64-1.42 2.24-2.32z"/></svg>
              </a>
              <a aria-label="YouTube" href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2c-.2-1.3-1.2-2.2-2.4-2.4C17.3 4.5 12 4.5 12 4.5s-5.3 0-7.2.3C3.6 5 2.6 5.9 2.4 7.2 2.1 9.1 2.1 12 2.1 12s0 2.9.3 4.8c.2 1.3 1.2 2.2 2.4 2.4 1.9.3 7.2.3 7.2.3s5.3 0 7.2-.3c1.2-.2 2.2-1.1 2.4-2.4.3-1.9.3-4.8.3-4.8s0-2.9-.3-4.8zM10.2 15.3V8.7L15.6 12l-5.4 3.3z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li><a href="/about" className="hover:text-white">About</a></li>
              <li><a href="/live" className="hover:text-white">Live</a></li>
              <li><a href="/blog" className="hover:text-white">Blog</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Legal</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Newsletter</h4>
            <p className="text-sm text-gray-300 mb-3">Get updates on services, events, and devotionals.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                try {
                  const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                  const j = await res.json().catch(() => ({}));
                  if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to subscribe');
                  toast.success('Subscribed successfully');
                  form.reset();
                } catch (err: any) {
                  toast.error(err?.message || 'Subscription failed');
                }
              }}
              className="flex gap-2"
            >
              <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Send His Word Ministries. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
