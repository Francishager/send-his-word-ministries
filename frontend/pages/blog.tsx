import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import HeroSlider, { HeroSlide } from '@/components/hero/HeroSlider';
import Link from 'next/link';

const slides: HeroSlide[] = [
  { src: '/images/hero/home-2.svg', title: 'Our Blog', subtitle: 'Stories, devotionals, and ministry updates.' },
  { src: '/images/hero/home-1.svg', title: 'Grow in the Word', subtitle: 'Practical teachings for everyday life.' },
];

export default function BlogPage() {
  return (
    <MainLayout title="Blog | Send His Word">
      <HeroSlider slides={slides} heightClass="h-[320px]" autoAdvanceMs={2000} />
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold">Latest Articles</h1>
        <p className="text-gray-700">We will publish devotionals and ministry news here. Check back soon!</p>
        <div className="rounded border bg-gray-50 p-6">
          <p className="text-gray-600">No posts yet. In the meantime, join our <Link href="/live" className="text-indigo-600 underline">Live service</Link>.</p>
        </div>
      </section>
    </MainLayout>
  );
}
