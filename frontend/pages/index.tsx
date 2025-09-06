import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import FadeUp from '@/components/ux/FadeUp';
import Link from 'next/link';
import React from 'react';
import useNextService from '@/hooks/useNextService';
import { Clock, PlayCircle, Users, HeartHandshake, Book, Church, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import stories from '@/data/stories.json';

const slides: HeroSlide[] = [
  {
    src: '/images/hero/home_hero_1.JPG',
    title: 'Send His Word Ministries',
    subtitle: 'A real-time hub for worship, prayer, and community engagement',
    ctaText: 'Join Live Service',
    ctaHref: '/live',
  },
  {
    src: '/images/hero/home_hero_2.JPG',
    title: 'You are Welcome Here',
    subtitle: 'Connect in chat, request prayer, and grow in fellowship',
    ctaText: 'Explore Community',
    ctaHref: '/about',
  },
  {
    src: '/images/hero/home_hero_3.JPG',
    title: 'Worship Anywhere',
    subtitle: 'Experience powerful worship and teaching from wherever you are',
    ctaText: 'Join Live',
    ctaHref: '/live',
  },
  {
    src: '/images/hero/home_hero_4.JPG',
    title: 'Prayer & Care',
    subtitle: 'Request prayer and meet with a minister 1:1 in a safe space',
    ctaText: 'Request Prayer',
    ctaHref: '/live',
  },
  {
    src: '/images/hero/home_hero_5.JPG',
    title: 'Grow Daily',
    subtitle: 'Follow devotions and take notes to deepen your faith',
    ctaText: 'Read Devotions',
    ctaHref: '/blog',
  },
];

// Local hook to load the admin-managed 'Service Moment' billboard
function useServiceMoment() {
  const [moment, setMoment] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    fetch('/api/moment')
      .then((r) => r.json())
      .then((j) => { if (mounted) setMoment(j?.moment || null); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  return { moment, loading };
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/shorts/')[1]?.split('/')[0] || null;
      }
      if (u.pathname === '/watch') {
        return u.searchParams.get('v');
      }
    }
    return null;
  } catch {
    return null;
  }
}

function toYouTubeEmbed(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Handle youtu.be short links
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${id}`;
    }
    // Handle shorts and normal watch URLs
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      // Fallback: use original
      return url;
    }
    return url;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const { service, startDate, isLive } = useNextService();
  const { moment } = useServiceMoment();
  const [momentPlaying, setMomentPlaying] = React.useState(false);
  const [highlights, setHighlights] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/highlights')
      .then((r) => r.json())
      .then((j) => setHighlights(Array.isArray(j?.highlights) ? j.highlights : []))
      .catch(() => {});
  }, []);
  return (
    <MainLayout>
      <HeroSlider slides={slides} autoAdvanceMs={2000} />

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <FadeUp className="p-6 rounded-lg border bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Worship Together</h3>
            <p className="text-gray-600 mb-4">Join our livestream with countdown, auto-switch, and replay with synced chat.</p>
            <Link className="text-indigo-600 font-medium" href="/live">Go to Live</Link>
          </FadeUp>
          <FadeUp className="p-6 rounded-lg border bg-gray-50" delayMs={80}>
            <h3 className="text-xl font-semibold mb-2">Request Prayer</h3>
            <p className="text-gray-600 mb-4">Our ministers would love to stand with you in prayer and faith.</p>
            <Link className="text-indigo-600 font-medium" href="/live#prayer">Ask for Prayer</Link>
          </FadeUp>
          <FadeUp className="p-6 rounded-lg border bg-gray-50" delayMs={140}>
            <h3 className="text-xl font-semibold mb-2">Give</h3>
            <p className="text-gray-600 mb-4">Partner with the mission and help us reach more people.</p>
            <Link className="text-indigo-600 font-medium" href="/give">Partner with Us</Link>
          </FadeUp>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-12 bg-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <FadeUp>
            <div className="text-3xl font-extrabold">120k+</div>
            <div className="text-indigo-100 text-sm">Prayers prayed</div>
          </FadeUp>
          <FadeUp delayMs={80}>
            <div className="text-3xl font-extrabold">10k+</div>
            <div className="text-indigo-100 text-sm">Lives impacted</div>
          </FadeUp>
          <FadeUp delayMs={140}>
            <div className="text-3xl font-extrabold">500+</div>
            <div className="text-indigo-100 text-sm">Devotions posted</div>
          </FadeUp>
          <FadeUp delayMs={200}>
            <div className="text-3xl font-extrabold">40+</div>
            <div className="text-indigo-100 text-sm">Partner churches</div>
          </FadeUp>
        </div>
      </section>

      {/* Upcoming service / Billboard */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <FadeUp className="p-6 rounded-xl bg-white border">
            <div className="flex items-center gap-3 mb-3">
              {isLive ? (
                <PlayCircle className="h-6 w-6 text-red-500" />
              ) : (
                <Clock className="h-6 w-6 text-indigo-600" />
              )}
              <h3 className="text-xl font-semibold">{isLive ? 'We are LIVE now' : 'Service Moment'}</h3>
            </div>
            <div className="text-gray-700">
              {!isLive && (
                <div className="mb-4 rounded-xl border overflow-hidden">
                  <div className="grid sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      {toYouTubeEmbed(moment?.videoUrl) ? (
                        <div className="bg-black relative w-full h-full min-h-[180px]">
                          {moment?.autoplay || momentPlaying ? (
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={`${toYouTubeEmbed(moment?.videoUrl)}?rel=0&modestbranding=1&controls=1&autoplay=${moment?.autoplay || momentPlaying ? '1' : '0'}&mute=${moment?.muted !== false ? '1' : '0'}${moment?.loop ? `&loop=1&playlist=${getYouTubeId(moment?.videoUrl) || ''}` : ''}`}
                              title={moment?.title || 'Service Moment'}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : (
                            <button onClick={() => setMomentPlaying(true)} className="absolute inset-0 w-full h-full group">
                              <img src={moment?.image || '/images/hero/home_hero_2.JPG'} alt={moment?.title || 'Service Moment'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-indigo-600"><path d="M8 5v14l11-7z"/></svg>
                                </span>
                              </span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <img src={moment?.image || '/images/hero/home_hero_2.JPG'} alt={moment?.title || 'Service Moment'} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="sm:col-span-2 p-4">
                      <h4 className="text-lg font-semibold mb-1">{moment?.title || 'Upcoming Highlight'}</h4>
                      <p className="text-sm text-gray-700 mb-3">{moment?.message || 'Stay tuned for our next powerful gathering. Invite someone who needs hope today.'}</p>
                      {moment?.ctaText && moment?.ctaHref && (
                        <a href={moment.ctaHref} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2">{moment.ctaText}</a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {isLive && (
                <Link href="/live" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2">
                  Join Live <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </FadeUp>
          <FadeUp className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white border" delayMs={100}>
            <h3 className="text-xl font-semibold mb-2">What to expect</h3>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Uplifting worship and teaching</li>
              <li>Live chat and moderated community</li>
              <li>Private prayer with ministers</li>
              <li>Moments and notes for later reflection</li>
            </ul>
          </FadeUp>
        </div>
      </section>

      {/* Ministries / Features grid */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">Our Ministries</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><Church className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Worship Services</h3></div>
              <p className="text-gray-600">Join our weekly services and special events from anywhere.</p>
            </div>
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><Users className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Small Groups</h3></div>
              <p className="text-gray-600">Grow in fellowship through circles and Bible studies.</p>
            </div>
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><HeartHandshake className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Prayer & Care</h3></div>
              <p className="text-gray-600">Receive prayer and pastoral care from trained ministers.</p>
            </div>
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><Book className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Devotions</h3></div>
              <p className="text-gray-600">Daily devotions and notes to encourage your journey.</p>
            </div>
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><PlayCircle className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Replays</h3></div>
              <p className="text-gray-600">Catch up on services with synced chat and highlights.</p>
            </div>
            <div className="p-6 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3 mb-2"><ArrowRight className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Next Steps</h3></div>
              <p className="text-gray-600">Get connected, serve, and partner with the mission.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories of Impact */}
      <section className="py-12 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeUp>
            <h2 className="text-2xl font-bold mb-6 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">Stories of Impact</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {stories.map((t: any, i: number) => (
              <FadeUp key={i} className="rounded-xl overflow-hidden bg-white border shadow-sm flex flex-col">
                <img
                  src={t.src}
                  alt={t.name}
                  className="w-full object-cover h-48 md:h-56"
                  style={{ objectPosition: t.focus || '50% 30%' }}
                />
                <figcaption className="p-4 flex-1 flex flex-col">
                  <p className="text-gray-700 text-sm">“{t.quote}”</p>
                  <div className="mt-3 text-xs text-gray-500">— {t.name}</div>
                </figcaption>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Past Highlights on Home */}
      <section className="py-12 bg-gradient-to-b from-[var(--brand-100,#eef2ff)] to-[var(--brand-200,#dbe3ff)]">
        <div className="max-w-6xl mx-auto px-4">
          <FadeUp>
            <h2 className="text-2xl font-bold mb-3 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">Past Highlights</h2>
            <p className="text-gray-700 mb-6 text-center">Moments from recent gatherings and outreach.</p>
          </FadeUp>
          <div className="rounded-xl overflow-hidden border">
            <HeroSlider
              slides={(highlights || []).map((h) => ({ src: h.src, title: h.title, subtitle: h.subtitle }))}
              autoAdvanceMs={2000}
              heightClass="h-[260px] md:h-[360px]"
            />
          </div>
        </div>
      </section>

      {/* Newsletter section removed per request */}
    </MainLayout>
  );
}
