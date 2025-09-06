import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';
import WysiwygEditor from '@/components/ux/WysiwygEditor';

export default function SubmitPostPage() {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = React.useState({
    title: '',
    excerpt: '',
    contentHtml: '<p></p>',
    coverImage: '/images/hero/home_hero_1.JPG',
    videoUrl: '',
    tags: '' as string,
    categoryId: '',
  });
  const [categories, setCategories] = React.useState<{id:string;name:string}[]>([]);
  const [saving, setSaving] = React.useState(false);
  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  React.useEffect(() => {
    fetch('/api/categories').then(r=>r.json()).then(j=> setCategories(j?.categories || [])).catch(()=>{});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) return;
    try {
      setSaving(true);
      const slugBase = form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `post-${Date.now()}`;
      const body = {
        id: `sub-${Date.now()}`,
        slug: slugBase,
        title: form.title,
        excerpt: form.excerpt,
        contentHtml: form.contentHtml,
        videoUrl: form.videoUrl || undefined,
        coverImage: form.coverImage || undefined,
        categoryId: form.categoryId,
        author: (user as any)?.name || (user as any)?.email || 'Member',
        date: new Date().toISOString(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isFeatured: false,
        isNews: false,
        status: 'pending',
      };
      const res = await fetch('/api/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to submit');
      setForm({ title: '', excerpt: '', contentHtml: '<p></p>', coverImage: '/images/hero/home_hero_1.JPG', videoUrl: '', tags: '', categoryId: '' });
      alert('Submitted! Your post is pending review by a minister/admin.');
    } catch (err: any) {
      alert(err?.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Submit a Post | Send His Word">
      <section className="relative">
        <div className="relative">
          <img src="/images/hero/home_hero_4.JPG" alt="Submit Post" className="w-full h-[280px] object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="max-w-6xl mx-auto px-4 w-full text-white pb-6 md:pb-0">
              <FadeUp>
                <h1 className="text-3xl md:text-5xl font-extrabold">Share Your Story</h1>
                <p className="text-gray-200 mt-2 max-w-2xl">Submit a devotional, testimony, or update. A minister/admin will review and publish.</p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        {!isAuthenticated ? (
          <div className="rounded-lg border p-6 bg-white text-gray-700">
            Please <Link href="/auth/login" className="text-indigo-600 underline">log in</Link> to submit a post.
          </div>
        ) : (
          <FadeUp>
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={form.title} onChange={(e) => on('title', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <input value={form.excerpt} onChange={(e) => on('excerpt', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => on('categoryId', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                  <input value={form.coverImage} onChange={(e) => on('coverImage', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  {form.coverImage && <img src={form.coverImage} className="mt-2 w-full h-40 object-cover rounded border" />}
                  <CloudinaryUpload onUploaded={(url) => on('coverImage', url)} className="mt-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video Embed URL (optional)</label>
                  <input value={form.videoUrl} onChange={(e) => on('videoUrl', e.target.value)} placeholder="https://www.youtube.com/embed/XXXXX" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  <CloudinaryUpload buttonText="Upload Video" accept="video/*" onUploaded={(url) => on('videoUrl', url)} className="mt-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => on('tags', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <WysiwygEditor value={form.contentHtml} onChange={(html) => on('contentHtml', html)} className="mb-2" />
                <p className="text-xs text-gray-500">Tip: Use the toolbar to format. Upload images/videos above and embed as needed.</p>
                <div className="pt-3">
                  <button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{saving ? 'Submitting…' : 'Submit for Review'}</button>
                </div>
              </div>
            </form>
          </FadeUp>
        )}
      </section>
    </MainLayout>
  );
}
