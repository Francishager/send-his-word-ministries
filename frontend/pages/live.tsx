import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import React from 'react';
import useNextService from '@/hooks/useNextService';
import LivePlayer from '@/components/live/LivePlayer';
import ChatPanel from '@/components/live/ChatPanel';
import PrayerQueue from '@/components/prayer/PrayerQueue';
import { useAuth } from '@/contexts/AuthContext';
import { Share2, ThumbsUp, Heart } from 'lucide-react';
import FadeUp from '@/components/ux/FadeUp';

const slides: HeroSlide[] = [
  {
    src: '/images/hero/live-1.svg',
    title: 'Live Service',
    subtitle: 'We go live soon. Join the community and invite a friend!',
    ctaText: 'Invite Someone',
    ctaHref: '/auth/login',
  },
  {
    src: '/images/hero/home-1.svg',
    title: 'Worship Together',
    subtitle: 'Experience powerful moments of worship from anywhere in the world.',
    ctaText: 'Join Live',
    ctaHref: '/live',
  },
  {
    src: '/images/hero/home-2.svg',
    title: 'Community & Prayer',
    subtitle: 'Share testimonies, request prayer, and connect with our community.',
    ctaText: 'Request Prayer',
    ctaHref: '/live',
  },
];

function useCountdown(targetDate?: Date) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  const totalMs = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  return { days, hours, minutes, seconds, totalMs };
}

export default function LivePage() {
  const { loading, error, service, startDate, isLive } = useNextService();
  const c = useCountdown(startDate);
  const { isAuthenticated } = useAuth();

  const provider = (service as any)?.stream_provider as any;
  const source = (service as any)?.stream_embed_url || (service as any)?.stream_source_id || '';
  const canRenderPlayer = Boolean(provider && source);

  return (
    <MainLayout title="Live Service">
      <HeroSlider slides={slides} heightClass="h-[360px]" autoAdvanceMs={2000} />

      <section className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-red-700">{error}</div>
        )}
        {!isLive ? (
          <FadeUp className="text-center">
            <h2 className="text-2xl font-semibold mb-1">Next service{service?.title ? `: ${service.title}` : ''}</h2>
            {startDate && (
              <p className="text-gray-600">Starts at {startDate.toLocaleString()}</p>
            )}
            <div className="mt-4 mx-auto max-w-xl rounded-2xl border border-gray-700 bg-gray-900/95 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
              <div className="text-xs tracking-widest text-gray-400">LIVE IN</div>
              <div className="mt-2 flex justify-center gap-3 sm:gap-4">
                {([
                  { label: 'Days', value: c.days },
                  { label: 'Hours', value: c.hours },
                  { label: 'Minutes', value: c.minutes },
                  { label: 'Seconds', value: c.seconds },
                ] as const).map((item) => (
                  <div key={item.label} className="rounded-md bg-black/40 border border-indigo-500/30 px-4 py-3 min-w-[84px] text-center">
                    <div className="font-mono text-3xl font-extrabold text-indigo-200 leading-none">{item.value.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] uppercase tracking-wider text-indigo-300/80 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-gray-600">This page will automatically switch to the livestream when we go live.</p>
          </FadeUp>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Player + details */}
            <div className="lg:col-span-2 space-y-4">
              <FadeUp className="bg-black rounded-xl overflow-hidden aspect-video">
                {canRenderPlayer ? (
                  <LivePlayer provider={provider} sourceIdOrUrl={source} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">Live Player</div>
                )}
              </FadeUp>
              {/* Service details / actions */}
              <FadeUp className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">Now Streaming</div>
                  <h3 className="text-xl font-semibold">{service?.title || 'Live Service'}</h3>
                  {startDate && <div className="text-xs text-gray-500">Started at {startDate.toLocaleString()}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
                    <ThumbsUp className="h-4 w-4" /> Amen
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
                    <Heart className="h-4 w-4" /> Bless
                  </button>
                  <a href={typeof window !== 'undefined' ? window.location.href : '/live'} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
                    <Share2 className="h-4 w-4" /> Share
                  </a>
                </div>
              </FadeUp>
            </div>

            {/* Right panel with tabs */}
            <aside className="space-y-4">
              <FadeUp className="bg-white rounded-xl border">
                <div className="flex border-b">
                  <TabButton active>Chat</TabButton>
                  <TabButton>Prayer</TabButton>
                </div>
                <div className="p-4">
                  <TabbedPanels serviceId={service?.id} isAuthenticated={isAuthenticated} />
                </div>
              </FadeUp>
              {/* Optional: viewers info */}
              <FadeUp className="bg-white rounded-xl border p-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <div>Viewers</div>
                  <div className="font-semibold">~ {Math.floor(Math.random()*200)+50}</div>
                </div>
              </FadeUp>
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

// Simple tab button and panels (local to this page)
function TabButton({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button className={`flex-1 px-4 py-2 text-sm font-medium ${active ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>{children}</button>
  );
}

function TabbedPanels({ serviceId, isAuthenticated }: { serviceId?: string; isAuthenticated: boolean }) {
  const [tab, setTab] = React.useState<'chat'|'prayer'>('chat');
  return (
    <div>
      <div className="hidden" aria-hidden>
        {/* buttons are rendered above; manage state by keyboard in future */}
      </div>
      <div className="min-h-[340px]">
        {tab === 'chat' ? (
          serviceId ? (
            <>
              {!isAuthenticated && (
                <div className="mb-2 text-sm text-gray-600">
                  <a href="/auth/login" className="text-indigo-600 underline">Sign in</a> to participate.
                </div>
              )}
              <ChatPanel serviceId={serviceId} canPost={isAuthenticated} />
            </>
          ) : (
            <div className="text-gray-600">Connecting…</div>
          )
        ) : (
          <>
            {!isAuthenticated && (
              <div className="mb-2 text-sm text-gray-600">
                <a href="/auth/login" className="text-indigo-600 underline">Sign in</a> to request prayer.
              </div>
            )}
            <PrayerQueue canRequest={isAuthenticated} />
          </>
        )}
      </div>
      {/* Tab controls (mobile/desktop consistent) */}
      <div className="flex gap-2 mt-3">
        <button onClick={() => setTab('chat')} className={`flex-1 rounded-md px-3 py-2 text-sm ${tab==='chat' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Chat</button>
        <button onClick={() => setTab('prayer')} className={`flex-1 rounded-md px-3 py-2 text-sm ${tab==='prayer' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Prayer</button>
      </div>
    </div>
  );
}
