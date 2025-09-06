import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import FadeUp from '@/components/ux/FadeUp';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  created_at?: string;
}

export default function Comments({ postId }: { postId: string }) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = React.useState<BlogComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [hp, setHp] = React.useState(''); // honeypot

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data || []) as any);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-line */ }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Please log in to comment');
    if (hp.trim()) return; // honeypot
    // Simple client-side rate limiting: 1 comment per 30 seconds
    const now = Date.now();
    const lastKey = `comment_last_${postId}`;
    const last = Number(localStorage.getItem(lastKey) || '0');
    if (now - last < 30_000) {
      toast.error('Please wait a few seconds before commenting again.');
      return;
    }
    // Simple profanity filter (client-side)
    const banned = ['badword1','badword2','badword3'];
    const lower = content.toLowerCase();
    if (banned.some((w) => lower.includes(w))) {
      toast.error('Please remove inappropriate language from your comment.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        post_id: postId,
        user_id: (user as any)?.id || null,
        content,
        status: 'pending' as const,
      };
      const { error } = await supabase.from('blog_comments').insert(payload);
      if (error) throw error;
      setContent('');
      localStorage.setItem(lastKey, String(now));
      toast.success('Comment submitted for review');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Comments</h3>
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">No comments yet.</div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <FadeUp key={c.id}>
              <article className="rounded-lg border bg-white p-3">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</div>
                <div className="mt-1 text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</div>
              </article>
            </FadeUp>
          ))}
        </div>
      )}

      <div className="mt-5">
        {isAuthenticated ? (
          <form onSubmit={submit} className="space-y-2">
            <div className="hidden">
              <input value={hp} onChange={(e) => setHp(e.target.value)} placeholder="website" />
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Add your comment" />
            <button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{saving ? 'Submitting…' : 'Post Comment'}</button>
          </form>
        ) : (
          <div className="text-sm text-gray-700">Please <a href="/auth/login" className="text-indigo-600 underline">log in</a> to comment.</div>
        )}
      </div>
    </section>
  );
}
