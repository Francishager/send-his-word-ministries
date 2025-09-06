import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { uploadToSupabase } from '@/lib/supabaseUpload';

interface TestimonyItem {
  id: string;
  user_id?: string | null;
  name: string;
  title: string;
  content: string;
  user_image_url?: string | null;
  media_image_url?: string | null;
  media_video_url?: string | null;
  approved?: boolean;
  created_at?: string;
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
    user_image_url: '',
    media_image_url: '',
    media_video_url: '',
  });

  const uploadProvider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER || 'cloudinary';

  const handleSupabaseFile = async (file: File, field: 'user_image_url' | 'media_image_url' | 'media_video_url') => {
    try {
      if (!file) return;
      const isVideo = file.type.startsWith('video/');
      if (field === 'media_video_url' && !isVideo) {
        toast.error('Please select a video file');
        return;
      }
      if ((field === 'user_image_url' || field === 'media_image_url') && !file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      const url = await uploadToSupabase(file, 'testimonies', (user as any)?.id);
      setForm((p) => ({ ...p, [field]: url }));
      toast.success('Uploaded successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    }
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonies')
          .select('*')
          .eq('approved', true)
          .order('priority', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw error;
        setItems((data || []) as any);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // basic client-side validation
      if (!form.title || form.title.trim().length < 3) {
        toast.error('Please provide a title (at least 3 characters).');
        return;
      }
      if (!form.content || form.content.trim().length < 10) {
        toast.error('Please share a bit more in the story (at least 10 characters).');
        return;
      }
      setSaving(true);
      const payload = {
        user_id: (user as any)?.id || null,
        name: form.name || (user as any)?.name || (user as any)?.email || 'Anonymous',
        title: form.title,
        content: form.content,
        user_image_url: form.user_image_url || null,
        media_image_url: form.media_image_url || null,
        media_video_url: form.media_video_url || null,
        approved: false,
      };
      const { data, error } = await supabase.from('testimonies').insert(payload).select('*').single();
      if (error) throw error;
      setItems((prev) => [data as any, ...prev]);
      setForm({ name: '', title: '', content: '', user_image_url: '', media_image_url: '', media_video_url: '' });
      toast.success('Thank you! Your testimony has been received and is pending review.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit testimony');
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
              {items.map((t) => (
                <FadeUp key={t.id}>
                  <article className="rounded-xl overflow-hidden border bg-white flex flex-col">
                    {t.media_image_url && <img src={t.media_image_url} alt={t.title} className="w-full h-44 object-cover" />}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-3">
                        {t.user_image_url ? (
                          <img src={t.user_image_url} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</div>
                        </div>
                      </div>
                      <h3 className="font-semibold mt-3">{t.title || 'Testimony'}</h3>
                      <p className="text-sm text-gray-700 mt-2 flex-1 whitespace-pre-wrap">{t.content}</p>
                      {t.media_video_url && (
                        <div className="mt-3">
                          <iframe className="w-full aspect-video rounded-md" src={t.media_video_url} allowFullScreen />
                        </div>
                      )}
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
                  <label className="block text-sm font-medium mb-1">Your Image (optional)</label>
                  <input value={form.user_image_url} onChange={(e) => on('user_image_url', e.target.value)} placeholder="https://..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  {uploadProvider === 'supabase' ? (
                    <div className="mt-2">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && handleSupabaseFile(e.target.files[0], 'user_image_url')} />
                    </div>
                  ) : (
                    <CloudinaryUpload onUploaded={(url) => on('user_image_url', url)} className="mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Testimony Image (optional)</label>
                  <input value={form.media_image_url} onChange={(e) => on('media_image_url', e.target.value)} placeholder="https://..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  {uploadProvider === 'supabase' ? (
                    <div className="mt-2">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && handleSupabaseFile(e.target.files[0], 'media_image_url')} />
                    </div>
                  ) : (
                    <CloudinaryUpload onUploaded={(url) => on('media_image_url', url)} className="mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video (optional)</label>
                  <input value={form.media_video_url} onChange={(e) => on('media_video_url', e.target.value)} placeholder="https://www.youtube.com/embed/..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  {uploadProvider === 'supabase' ? (
                    <div className="mt-2">
                      <input type="file" accept="video/*" onChange={(e) => e.target.files && handleSupabaseFile(e.target.files[0], 'media_video_url')} />
                    </div>
                  ) : (
                    <CloudinaryUpload buttonText="Upload Video" accept="video/*" onUploaded={(url) => on('media_video_url', url)} className="mt-2" />
                  )}
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
