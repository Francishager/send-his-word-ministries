import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: string;
  author?: string;
  date?: string;
  tags?: string[];
  isFeatured?: boolean;
  isNews?: boolean;
}

function useBlog() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    fetch('/api/blog')
      .then((r) => r.json())
      .then((j) => {
        if (mounted) setPosts(j?.posts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize category from URL (?category=...)
  React.useEffect(() => {
    const q = (router.query?.category as string) || '';
    if (q && q !== categoryId) {
      setCategoryId(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query?.category]);

  const updateCategory = (id: string) => {
    setCategoryId(id);
    const nextQuery: Record<string, any> = { ...router.query };
    if (id) nextQuery.category = id; else delete nextQuery.category;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  };
  return { posts, loading };
}

export default function BlogIndexPage() {
  const { posts } = useBlog();
  const [query, setQuery] = React.useState('');
  const [tag, setTag] = React.useState<string>('');
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j?.categories || []))
      .catch(() => {});
  }, []);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).sort();
  const published = posts.filter((p) => (p as any).status !== 'pending');
  const featured = published.find((p) => p.isFeatured);
  const news = published.filter((p) => p.isNews);
  const filtered = published.filter((p) => {
    const q = query.trim().toLowerCase();
    const okQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));
    const okT = !tag || (p.tags || []).includes(tag);
    const okC = !categoryId || (p as any).categoryId === categoryId;
    return okQ && okT && okC;
  });

  return (
    <MainLayout
      title="Blog | Send His Word"
      description="News, devotionals, and updates from Send His Word Ministries"
    >
      <section className="relative">
        <div className="relative">
          <img
            src={featured?.coverImage || '/images/hero/home_hero_3.JPG'}
            alt="Blog"
            className="w-full h-[320px] object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="max-w-6xl mx-auto px-4 w-full text-white pb-6 md:pb-0">
              <FadeUp>
                <h1 className="text-3xl md:text-5xl font-extrabold">Blog & News</h1>
                <p className="text-gray-200 mt-2 max-w-2xl">
                  Devotionals, testimonies, and ministry updates to encourage your faith.
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {isAuthenticated && (
              <Link
                href="/blog/submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500"
              >
                Submit Post
              </Link>
            )}
            <button
              onClick={() =>
                document
                  .getElementById('categories-sidebar')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="lg:hidden rounded-md border px-3 py-2 text-sm"
            >
              Categories
            </button>
          </div>
        </div>
      </section>

      {featured && (
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <h2 className="text-2xl font-bold mb-4 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">
            Featured
          </h2>
          <FadeUp>
            <Link
              href={`/blog/${featured.slug}`}
              className="block rounded-2xl overflow-hidden border bg-white"
            >
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-full">
                  <img
                    src={featured.coverImage || '/images/hero/home_hero_4.JPG'}
                    alt={featured.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500">
                    {new Date(featured.date || Date.now()).toLocaleDateString()}
                  </div>
                  <h3 className="text-2xl font-extrabold mt-1">{featured.title}</h3>
                  <p className="text-gray-700 mt-2">{featured.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(featured.tags || []).map((t) => (
                      <span
                        key={t}
                        className="text-xs rounded bg-indigo-50 text-indigo-700 px-2 py-1"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </FadeUp>
        </section>
      )}

      {news.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-2xl font-bold mb-4 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">
            News
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((p) => (
              <FadeUp key={p.id}>
                <article className="rounded-xl overflow-hidden border bg-white flex flex-col">
                  <Link href={`/blog/${p.slug}`}>
                    <img
                      src={p.coverImage || '/images/hero/home_hero_2.JPG'}
                      alt={p.title}
                      className="w-full h-44 object-cover"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500">
                      {new Date(p.date || Date.now()).toLocaleDateString()}
                    </div>
                    <Link href={`/blog/${p.slug}`} className="font-semibold mt-1">
                      {p.title}
                    </Link>
                    <p className="text-sm text-gray-700 mt-2 flex-1">{p.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.tags || []).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] rounded bg-indigo-50 text-indigo-700 px-2 py-1"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 lg:order-1">
          {/* Mobile categories dropdown */}
          <div className="lg:hidden mb-3 flex items-center gap-2">
            <label htmlFor="mobile-category" className="text-sm text-gray-700">All categories</label>
            <select
              id="mobile-category"
              value={categoryId}
              onChange={(e) => updateCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm flex-1"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">
            All Posts
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <FadeUp key={p.id}>
                <article className="rounded-xl overflow-hidden border bg-white flex flex-col">
                  <Link href={`/blog/${p.slug}`}>
                    <img
                      src={p.coverImage || '/images/hero/home_hero_5.JPG'}
                      alt={p.title}
                      className="w-full h-44 object-cover"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500">
                      {new Date(p.date || Date.now()).toLocaleDateString()}
                    </div>
                    <Link href={`/blog/${p.slug}`} className="font-semibold mt-1">
                      {p.title}
                    </Link>
                    <p className="text-sm text-gray-700 mt-2 flex-1">{p.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.tags || []).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] rounded bg-indigo-50 text-indigo-700 px-2 py-1"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
        <aside id="categories-sidebar" className="lg:order-2">
          <div className="rounded-xl border bg-white p-4 sticky top-20">
            <h3 className="font-semibold mb-2">Categories</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  onClick={() => updateCategory('')}
                  className={`hover:underline ${categoryId === '' ? 'font-semibold text-indigo-700' : ''}`}
                >
                  All
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => updateCategory(c.id)}
                    className={`hover:underline ${categoryId === c.id ? 'font-semibold text-indigo-700' : ''}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </MainLayout>
  );
}
