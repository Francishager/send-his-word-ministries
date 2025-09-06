import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import FadeUp from '@/components/ux/FadeUp';

export default function AboutPage() {
  const slides: HeroSlide[] = [
    {
      src: '/images/hero/about_hero_1.JPG',
      title: 'About Send His Word',
      subtitle: 'Called to share the Gospel and care for people everywhere',
      ctaText: 'Join the Mission',
      ctaHref: '/live',
    },
    {
      src: '/images/hero/about_hero_2.JPG',
      title: 'A Church Without Walls',
      subtitle: 'Worship, prayer, and discipleship across borders',
    },
    {
      src: '/images/hero/about_hero_3.JPG',
      title: 'Community & Care',
      subtitle: 'We pray, serve, and grow together',
    },
    {
      src: '/images/hero/about_hero_4.JPG',
      title: 'Equipping Believers',
      subtitle: 'Devotions, notes, and small groups for growth',
    },
    {
      src: '/images/hero/about_hero_5.JPG',
      title: 'Partner With Us',
      subtitle: 'Your time and gifts make a kingdom impact',
    },
  ];
  return (
    <MainLayout title="About | Send His Word">
      <HeroSlider slides={slides} autoAdvanceMs={3500} />

      {/* Mission + Beliefs with deeper indigo gradient and motion */}
      <section className="relative py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 via-indigo-50 to-indigo-100/70" />
        <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
          <FadeUp className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-3 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-4 text-center">
              Send His Word Ministries exists to proclaim the Gospel, nurture believers, and
              demonstrate God’s love through prayer and service. We are a community gathered across
              regions, united in Christ, equipped by the Holy Spirit, and committed to making
              disciples.
            </p>
            <p className="text-gray-700 mb-4 text-center">
              We believe the church is not limited by walls, and technology helps us connect, care,
              and grow together—wherever we are.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {[
                {
                  title: 'Worship & Word',
                  desc: 'Spirit-led worship and faithful teaching for daily life.',
                },
                {
                  title: 'Prayer & Care',
                  desc: 'We pray with you and walk with you through every season.',
                },
                {
                  title: 'Discipleship',
                  desc: 'Groups, devotions, and tools that help you grow in Christ.',
                },
                {
                  title: 'Global Community',
                  desc: 'One body, many locations—gathered to glorify Jesus.',
                },
              ].map((card, idx) => (
                <div
                  key={card.title}
                  className="rounded-xl border p-5 bg-white/80 backdrop-blur transition transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="font-semibold mb-1">{card.title}</h3>
                  <p className="text-gray-700 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
          <aside>
            <FadeUp className="rounded-xl border p-5 bg-white/80 backdrop-blur">
              <h3 className="font-semibold mb-2">What We Believe</h3>
              <ul className="space-y-2 text-sm text-gray-800 list-disc list-inside">
                <li>The Bible is God’s inspired Word.</li>
                <li>Salvation is by grace through faith in Jesus Christ.</li>
                <li>The Holy Spirit empowers us for life and mission.</li>
                <li>The Church is Christ’s body in the world.</li>
              </ul>
            </FadeUp>
          </aside>
        </div>
      </section>

      {/* Rotating image cards (changes every 2s) */}
      <section className="py-12 bg-gradient-to-b from-indigo-50 to-indigo-100/70">
        <div className="max-w-6xl mx-auto px-4">
          <FadeUp>
            <h2 className="text-2xl font-bold mb-3 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">
              Ministries in Action
            </h2>
            <p className="text-gray-700 mb-6 text-center">
              A glimpse of how God is moving through worship, prayer, and service.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RotatingCard
              title="Worship"
              images={[
                '/images/hero/about_hero_1.JPG',
                '/images/hero/home_hero_1.JPG',
                '/images/hero/home_hero_3.JPG',
              ]}
            />
            <RotatingCard
              title="Prayer"
              images={[
                '/images/hero/about_hero_2.JPG',
                '/images/hero/home_hero_2.JPG',
                '/images/hero/home_hero_5.JPG',
              ]}
            />
            <RotatingCard
              title="Community"
              images={[
                '/images/hero/about_hero_3.JPG',
                '/images/hero/home_hero_4.JPG',
                '/images/hero/home_hero_1.JPG',
              ]}
            />
            <RotatingCard
              title="Outreach"
              images={[
                '/images/hero/about_hero_4.JPG',
                '/images/hero/about_hero_5.JPG',
                '/images/hero/home_hero_2.JPG',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Past Highlights moved to Home page */}

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <FadeUp>
            <h2 className="text-2xl font-bold mb-2">Be Part of the Story</h2>
            <p className="text-gray-700 mb-4">
              Worship with us live, request prayer, and join a small group to grow in faith.
            </p>
            <a
              href="/live"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-white font-medium hover:bg-indigo-500"
            >
              Join a Live Service
            </a>
          </FadeUp>
        </div>
      </section>
    </MainLayout>
  );
}

// Local rotating card with smooth crossfade/slide every 2s
function RotatingCard({ title, images }: { title: string; images: string[] }) {
  const [i, setI] = React.useState(0);
  const [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    const id = setInterval(() => {
      setAnim(true);
      setTimeout(() => {
        setI((p) => (p + 1) % images.length);
        setAnim(false);
      }, 600);
    }, 2000);
    return () => clearInterval(id);
  }, [images.length]);
  const curr = images[i];
  const next = images[(i + 1) % images.length];
  return (
    <div className="rounded-xl overflow-hidden border bg-white/80 backdrop-blur group transition hover:shadow-md">
      <div className="relative h-40">
        <img
          src={curr}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${anim ? '-translate-x-2 opacity-0 scale-[1.01]' : 'translate-x-0 opacity-100 scale-[1.04]'}`}
        />
        <img
          src={next}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${anim ? 'translate-x-0 opacity-100 scale-[1.04]' : 'translate-x-2 opacity-0 scale-[1.01]'}`}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">
          Stories, photos, and testimonies from our community.
        </p>
      </div>
    </div>
  );
}
