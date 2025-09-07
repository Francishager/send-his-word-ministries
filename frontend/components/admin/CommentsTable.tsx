import React from 'react';
import FadeUp from '@/components/ux/FadeUp';
import { Button } from '@/components/ui/button';

export interface CommentItem {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  created_at?: string;
  blog_posts?: { id: string; slug: string; title: string };
}

export default function CommentsTable({
  items,
  loading,
  saving,
  onSetStatus,
}: {
  items: CommentItem[];
  loading: boolean;
  saving: boolean;
  onSetStatus: (id: string, status: CommentItem['status']) => void;
}) {
  const filtered = items; // parent can pre-filter; keep render-only here
  return (
    <FadeUp>
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border p-6 bg-white text-gray-700">No comments found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Post</th>
                <th className="px-3 py-2">Content</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 text-gray-600">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                  </td>
                  <td
                    className="px-3 py-2 text-gray-600 truncate max-w-[220px]"
                    title={c.blog_posts?.title || c.blog_posts?.slug || c.post_id}
                  >
                    <div className="font-medium">{c.blog_posts?.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">/{c.blog_posts?.slug || c.post_id}</div>
                  </td>
                  <td className="px-3 py-2 max-w-[420px] truncate" title={c.content}>
                    {c.content}
                  </td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" disabled={saving} onClick={() => onSetStatus(c.id, 'approved')}>
                        Approve
                      </Button>
                      <Button variant="outline" disabled={saving} onClick={() => onSetStatus(c.id, 'rejected')}>
                        Reject
                      </Button>
                      <Button variant="outline" disabled={saving} onClick={() => onSetStatus(c.id, 'spam')}>
                        Spam
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FadeUp>
  );
}
