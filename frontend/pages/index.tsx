import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import Link from 'next/link';

const slides: HeroSlide[] = [
  {
    src: '/images/hero/home-1.svg',
    title: 'Send His Word Ministries',
    subtitle: 'A real-time hub for worship, prayer, and community engagement',
    ctaText: 'Join Live Service',
    ctaHref: '/live',
  },
  {
    src: '/images/hero/home-2.svg',
    title: 'You are Welcome Here',
    subtitle: 'Connect in chat, request prayer, and grow in fellowship',
    ctaText: 'Sign In',
    ctaHref: '/auth/login',
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSlider slides={slides} autoAdvanceMs={2000} />

      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Worship Together</h3>
            <p className="text-gray-600 mb-4">Join our livestream with countdown, auto-switch, and replay with synced chat.</p>
            <Link className="text-indigo-600 font-medium" href="/live">Go to Live</Link>
          </div>
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Request Prayer</h3>
            <p className="text-gray-600 mb-4">Public prayer wall and private 1:1 rooms with triage and care.</p>
            <Link className="text-indigo-600 font-medium" href="/auth/login">Sign In</Link>
          </div>
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Give</h3>
            <p className="text-gray-600 mb-4">Support through Mobile Money and card rails via Stripe/PesaPal.</p>
            <Link className="text-indigo-600 font-medium" href="/auth/login">Start Giving</Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
