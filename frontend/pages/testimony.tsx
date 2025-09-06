import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';
import { useAuth } from '@/contexts/AuthContext';

interface TestimonyItem {
  id: string;
  name: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  date: string;
  approved?: boolean;
}

export default function TestimonyPage() {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = React.useState<TestimonyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
  });

  React.useEffect(() => {
    fetch('/api/testimonies')
      .then((r) => r.json())
      .then((j) => setItems(j?.testimonies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        ...form,
        name: form.name || (user as any)?.name || (user as any)?.email || 'Anonymous',
      };
      const res = await fetch('/api/testimonies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to submit testimony');
      setItems((prev) => [j.item, ...prev]);
      setForm({ name: '', title: '', content: '', imageUrl: '', videoUrl: '' });
      alert('Thank you! Your testimony has been received. Pending review.');
    } catch (e: any) {
      alert(e?.message || 'Failed to submit testimony');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Testimonies | Send His Word" description="Be encouraged by what God is doing and share your testimony.">
      {/* Hero */}
      <section className="relative">
        <div className="relative">
          <img src="/images/hero/home_hero_2.JPG" alt="Testimonies" className="w-full h-[280px] object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="max-w-6xl mx-auto px-4 w-full text-white pb-6 md:pb-0">
              <FadeUp>
                <h1 className="text-3xl md:text-5xl font-extrabold">Testimonies</h1>
                <p className="text-gray-200 mt-2 max-w-2xl">Read and share what God is doing through Send His Word Ministries.</p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-4 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">Recent Testimonies</h2>
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border p-6 bg-white text-gray-700">No testimonies yet. Be the first to share!</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.filter(t => t.approved !== false).map((t) => (
                <FadeUp key={t.id}>
                  <article className="rounded-xl overflow-hidden border bg-white flex flex-col">
                    {t.imageUrl && <img src={t.imageUrl} alt={t.title} className="w-full h-44 object-cover" />}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                      <h3 className="font-semibold mt-1">{t.title || 'Testimony'}</h3>
                      <p className="text-sm text-gray-700 mt-2 flex-1 whitespace-pre-wrap">{t.content}</p>
                      <div className="mt-3 text-xs text-gray-500">— {t.name}</div>
                    </div>
                  </article>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
        <aside>
          <div className="rounded-xl border bg-white p-4 sticky top-20">
            <h3 className="font-semibold mb-2">Share Your Testimony</h3>
            {isAuthenticated ? (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={form.title} onChange={(e) => on('title', e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name (optional)</label>
                  <input value={form.name} onChange={(e) => on('name', e.target.value)} placeholder="Anonymous" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Story</label>
                  <textarea value={form.content} onChange={(e) => on('content', e.target.value)} rows={5} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image (optional)</label>
                  <input value={form.imageUrl} onChange={(e) => on('imageUrl', e.target.value)} placeholder="https://..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  <CloudinaryUpload onUploaded={(url) => on('imageUrl', url)} className="mt-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video (optional)</label>
                  <input value={form.videoUrl} onChange={(e) => on('videoUrl', e.target.value)} placeholder="https://www.youtube.com/embed/..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  <CloudinaryUpload buttonText="Upload Video" accept="video/*" onUploaded={(url) => on('videoUrl', url)} className="mt-2" />
                </div>
                <button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{saving ? 'Submitting…' : 'Submit Testimony'}</button>
              </form>
            ) : (
              <div className="text-sm text-gray-700">Please <a href="/auth/login" className="text-indigo-600 underline">log in</a> to share your testimony.</div>
            )}
          </div>
        </aside>
      </section>
    </MainLayout>
  );
}
