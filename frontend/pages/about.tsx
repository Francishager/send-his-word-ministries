import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';

const slides: HeroSlide[] = [
  { src: '/images/hero/home-1.svg', title: 'About Us', subtitle: 'Learn more about our mission and vision.' },
  { src: '/images/hero/home-2.svg', title: 'Our Community', subtitle: 'We are a family passionate about the Gospel.' },
];

export default function AboutPage() {
  return (
    <MainLayout title="About | Send His Word">
      <HeroSlider slides={slides} heightClass="h-[320px]" autoAdvanceMs={2000} />
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-4">
        <h1 className="text-3xl font-bold">About Send His Word Ministries</h1>
        <p className="text-gray-700">We exist to spread the Gospel and connect hearts to God\'s word through worship, prayer, and community.</p>
        <p className="text-gray-700">Join us in live services, devotionals, and meaningful engagements that transform lives.</p>
      </section>
    </MainLayout>
  );
}
