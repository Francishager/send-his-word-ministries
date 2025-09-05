import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import React from 'react';
import useNextService from '@/hooks/useNextService';
import LivePlayer from '@/components/live/LivePlayer';
import ChatPanel from '@/components/live/ChatPanel';
import PrayerQueue from '@/components/prayer/PrayerQueue';
import { useAuth } from '@/contexts/AuthContext';

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
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-1">Next service{service?.title ? `: ${service.title}` : ''}</h2>
            {startDate && (
              <p className="text-gray-600">Starts at {startDate.toLocaleString()}</p>
            )}
            <div className="mt-4 flex justify-center gap-4 text-white">
              {([
                { label: 'Days', value: c.days },
                { label: 'Hours', value: c.hours },
                { label: 'Minutes', value: c.minutes },
                { label: 'Seconds', value: c.seconds },
              ] as const).map((item) => (
                <div key={item.label} className="bg-indigo-600 rounded-md px-4 py-3 min-w-[84px]">
                  <div className="text-3xl font-bold leading-none">{item.value.toString().padStart(2, '0')}</div>
                  <div className="text-xs uppercase tracking-wide opacity-90">{item.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-600">This page will automatically switch to the livestream when we go live.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-black rounded-lg overflow-hidden aspect-video">
              {canRenderPlayer ? (
                <LivePlayer provider={provider} sourceIdOrUrl={source} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">Live Player</div>
              )}
            </div>
            <aside className="space-y-4">
              <div className="bg-white rounded-lg border p-4 h-[360px]">
                <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                {service?.id ? (
                  <>
                    {!isAuthenticated && (
                      <div className="mb-2 text-sm text-gray-600">
                        <a href="/auth/login" className="text-indigo-600 underline">Sign in</a> to participate.
                      </div>
                    )}
                    <ChatPanel serviceId={service.id} canPost={isAuthenticated} />
                  </>
                ) : (
                  <div className="text-gray-600">Connecting…</div>
                )}
              </div>
              <div className="bg-white rounded-lg border p-4">
                {!isAuthenticated && (
                  <div className="mb-2 text-sm text-gray-600">
                    <a href="/auth/login" className="text-indigo-600 underline">Sign in</a> to request prayer.
                  </div>
                )}
                <PrayerQueue canRequest={isAuthenticated} />
              </div>
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
