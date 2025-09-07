import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import FadeUp from '@/components/ux/FadeUp';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

interface CommentItem {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  created_at?: string;
  blog_posts?: { id: string; slug: string; title: string };
}

const CommentsTable = dynamic(() => import('@/components/admin/CommentsTable'), { ssr: false });

function AdminCommentsPage() {
  const [items, setItems] = React.useState<CommentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected' | 'spam'>('pending');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    try {
      // Build base query with join to blog_posts for slug/title
      let query = supabase
        .from('blog_comments')
        .select('id, post_id, user_id, content, status, created_at, blog_posts!inner(id,slug,title)')
        .order('created_at', { ascending: false });

      // Status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Search filter across comment content, post slug, and post title
      if (search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(
          `content.ilike.${q},blog_posts.slug.ilike.${q},blog_posts.title.ilike.${q}`
        );
      }

      // Pagination via range
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      setItems((data || []) as any);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-line */ }, [filter, search, page]);

  const setStatus = async (id: string, status: CommentItem['status']) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('blog_comments').update({ status }).eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((c) => (filter === 'all' ? true : c.status === filter));

  return (
    <MainLayout title="Admin · Comments">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Comments Moderation</h1>
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="Search content, post slug or title" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="spam">Spam</option>
              <option value="all">All</option>
            </select>
            <Button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
          </div>
        </div>

        <FadeUp>
          <CommentsTable
            items={filtered as any}
            loading={loading}
            saving={saving}
            onSetStatus={setStatus}
          />
        </FadeUp>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>Previous</Button>
          <div className="text-sm text-gray-600">Page {page + 1}</div>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={loading || items.length < pageSize}>Next</Button>
        </div>
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminCommentsPage, [UserRole.MINISTER, UserRole.ADMIN]);
