import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage?: string;
  videoUrl?: string;
  author?: string;
  date?: string;
  tags?: string[];
  isFeatured?: boolean;
  isNews?: boolean;
}

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [post, setPost] = React.useState<Post | null>(null);
  const [all, setAll] = React.useState<Post[]>([]);
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = React.useState<any[]>([]);
  const [cForm, setCForm] = React.useState({ content: '', imageUrl: '', videoUrl: '' });

  React.useEffect(() => {
    if (!slug) return;
    let mounted = true;
    fetch('/api/blog')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        const list: Post[] = j?.posts || [];
        setAll(list);
        const p = list.find((x) => x.slug === slug) || null;
        setPost(p);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [slug]);

  React.useEffect(() => {
    if (!slug) return;
    let mounted = true;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((j) => { if (mounted) setComments(j?.comments || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [slug]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) return;
    try {
      const safeId = (user as any)?.id || (user as any)?.email || 'user';
      const safeName = (user as any)?.name || (user as any)?.email || 'Member';
      const body = {
        id: `c-${Date.now()}`,
        slug,
        userId: safeId,
        name: safeName,
        content: cForm.content,
        imageUrl: cForm.imageUrl || undefined,
        videoUrl: cForm.videoUrl || undefined,
        date: new Date().toISOString(),
      };
      const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to post');
      setCForm({ content: '', imageUrl: '', videoUrl: '' });
      // reload comments
      const r2 = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      const j2 = await r2.json();
      setComments(j2?.comments || []);
    } catch (err) {
      // Optional: add toast
    }
  };

  const idx = post ? all.findIndex((p) => p.slug === post.slug) : -1;
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  if (!post) {
    return (
      <MainLayout title="Loading…">
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-gray-600">Loading post…</div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${post.title} | Send His Word`} description={post.excerpt}>
      <section className="relative">
        <div className="relative">
          <img src={post.coverImage || '/images/hero/home_hero_2.JPG'} alt={post.title} className="w-full h-[320px] object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="max-w-4xl mx-auto px-4 w-full text-white pb-6 md:pb-0">
              <FadeUp>
                <div className="text-sm text-indigo-200">{new Date(post.date || Date.now()).toLocaleDateString()}</div>
                <h1 className="text-3xl md:text-5xl font-extrabold">{post.title}</h1>
                {post.excerpt && <p className="text-gray-200 mt-2 max-w-2xl">{post.excerpt}</p>}
                {post.isNews && <span className="inline-block mt-3 text-xs rounded bg-red-100 text-red-700 px-2 py-1">News</span>}
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-indigo max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </article>
        {post.videoUrl && (
          <div className="mt-6 aspect-video">
            <iframe className="w-full h-full" src={post.videoUrl} title="post video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {(post.tags || []).map((t) => (
            <Link key={t} href={{ pathname: '/blog', query: { tag: t } }} className="text-xs rounded bg-indigo-50 text-indigo-700 px-2 py-1">
              #{t}
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="text-indigo-600 hover:underline">← {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="text-indigo-600 hover:underline">{next.title} →</Link>
          ) : <span />}
        </div>

        {/* Comments */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl font-semibold mb-4">Comments</h3>
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-4 bg-white">
                <div className="text-sm text-gray-500">{new Date(c.date || Date.now()).toLocaleString()} · <span className="font-medium text-gray-800">{c.name}</span></div>
                <p className="text-gray-800 mt-1 whitespace-pre-wrap">{c.content}</p>
                {c.imageUrl && (
                  <div className="mt-2">
                    <img src={c.imageUrl} alt="comment attachment" className="w-full max-h-72 object-cover rounded" />
                  </div>
                )}
                {c.videoUrl && (
                  <div className="mt-2 aspect-video">
                    <iframe className="w-full h-full" src={c.videoUrl} title="comment video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-sm text-gray-600">Be the first to comment.</div>
            )}
          </div>

          {/* Comment form (requires login) */}
          <div className="mt-6">
            {isAuthenticated ? (
              <form onSubmit={submitComment} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Comment</label>
                  <textarea value={cForm.content} onChange={(e) => setCForm({ ...cForm, content: e.target.value })} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
                    <input value={cForm.imageUrl} onChange={(e) => setCForm({ ...cForm, imageUrl: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <CloudinaryUpload onUploaded={(url) => setCForm((p) => ({ ...p, imageUrl: url }))} className="mt-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Video Embed URL (optional)</label>
                    <input value={cForm.videoUrl} onChange={(e) => setCForm({ ...cForm, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <CloudinaryUpload buttonText="Upload Video" accept="video/*" onUploaded={(url) => setCForm((p) => ({ ...p, videoUrl: url }))} className="mt-2" />
                  </div>
                </div>
                <button className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">Post Comment</button>
              </form>
            ) : (
              <div className="text-sm text-gray-700">Please <Link href="/auth/login" className="text-indigo-600 underline">log in</Link> to comment.</div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
