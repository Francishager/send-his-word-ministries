import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import FadeUp from '@/components/ux/FadeUp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';
import WysiwygEditor from '@/components/ux/WysiwygEditor';

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
  status?: 'published' | 'pending';
}

function AdminBlogPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<Post | null>(null);
  const [categories, setCategories] = React.useState<{id:string;name:string}[]>([]);
  const dragIndex = React.useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/blog');
      const j = await r.json();
      setPosts(j?.posts || []);
      const rc = await fetch('/api/categories');
      const jc = await rc.json();
      setCategories(jc?.categories || []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const startNew = () => {
    const now = new Date().toISOString();
    setEditing({
      id: `post-${Date.now()}`,
      slug: `post-${Date.now()}`,
      title: '',
      excerpt: '',
      contentHtml: '<p></p>',
      coverImage: '/images/hero/home_hero_1.JPG',
      author: 'SHWM Team',
      date: now,
      tags: [],
      isFeatured: false,
      isNews: false,
      status: 'pending',
    });
  };

  const editPost = (p: Post) => setEditing({ ...p });
  const cancel = () => setEditing(null);

  const upsert = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Save failed');
      setEditing(null);
      await load();
    } catch (e) {
      // handle UI toast if desired
    } finally {
      setSaving(false);
    }
  };

  const onField = (field: keyof Post, value: any) => setEditing((prev) => prev ? { ...prev, [field]: value } : prev);
  const onTagChange = (value: string) => onField('tags', value.split(',').map((t) => t.trim()).filter(Boolean));

  // DnD for list ordering
  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from == null || from === index) return;
    setPosts((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/blog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(posts) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save order');
    } catch (e) {
      // optional toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Blog">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Blog Manager</h1>
          <div className="flex gap-2">
            {!editing && <Button onClick={startNew}>New Post</Button>}
            {editing && (
              <>
                <Button variant="secondary" onClick={cancel}>Cancel</Button>
                <Button onClick={upsert} disabled={saving}>{saving ? 'Saving…' : 'Save Post'}</Button>
              </>
            )}
          </div>
        </div>

        {/* List */}
        {!editing && (
          <FadeUp>
            {loading ? (
              <div className="text-gray-600">Loading…</div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm text-gray-600">Drag rows to reorder. Click Save Order to persist.</div>
                  <Button size="sm" variant="secondary" onClick={saveOrder} disabled={saving}>{saving ? 'Saving…' : 'Save Order'}</Button>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Slug</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Tags</th>
                      <th className="px-3 py-2">Flags</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p, idx) => (
                      <tr key={p.id} className="border-t cursor-move" draggable onDragStart={onDragStart(idx)} onDragOver={onDragOver(idx)} onDrop={onDrop(idx)}>
                        <td className="px-3 py-2 font-medium">{p.title}</td>
                        <td className="px-3 py-2 text-gray-600">{p.slug}</td>
                        <td className="px-3 py-2 text-gray-600">{new Date(p.date || Date.now()).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-gray-600">{(p.tags || []).join(', ')}</td>
                        <td className="px-3 py-2 text-gray-600">{p.isFeatured ? 'Featured' : ''} {p.isNews ? 'News' : ''}</td>
                        <td className="px-3 py-2 text-gray-600">{p.status || 'published'}</td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="outline" onClick={() => editPost(p)}>Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FadeUp>
        )}

        {/* Editor */}
        {editing && (
          <FadeUp>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <Label className="block mb-1">Title</Label>
                  <Input value={editing.title} onChange={(e) => onField('title', e.target.value)} placeholder="Post title" />
                </div>
                <div>
                  <Label className="block mb-1">Category</Label>
                  <select value={(editing as any).categoryId || ''} onChange={(e) => onField('categoryId' as any, e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 bg-white">
                    <option value="" disabled>Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="block mb-1">Slug</Label>
                  <Input value={editing.slug} onChange={(e) => onField('slug', e.target.value)} placeholder="my-post-slug" />
                </div>
                <div>
                  <Label className="block mb-1">Excerpt</Label>
                  <Input value={editing.excerpt} onChange={(e) => onField('excerpt', e.target.value)} placeholder="Short summary" />
                </div>
                <div>
                  <Label className="block mb-1">Cover Image</Label>
                  <Input value={editing.coverImage || ''} onChange={(e) => onField('coverImage', e.target.value)} placeholder="/images/hero/home_hero_1.JPG" />
                  {editing.coverImage && <img src={editing.coverImage} alt="cover" className="mt-2 w-full h-40 object-cover rounded border" />}
                  <CloudinaryUpload onUploaded={(url) => onField('coverImage', url)} className="mt-2" />
                </div>
                <div>
                  <Label className="block mb-1">Video URL (optional, embed URL)</Label>
                  <Input value={editing.videoUrl || ''} onChange={(e) => onField('videoUrl', e.target.value)} placeholder="https://www.youtube.com/embed/XXXXX" />
                  <CloudinaryUpload buttonText="Upload Video" accept="video/*" onUploaded={(url) => onField('videoUrl', url)} className="mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block mb-1">Author</Label>
                    <Input value={editing.author || ''} onChange={(e) => onField('author', e.target.value)} placeholder="Author name" />
                  </div>
                  <div>
                    <Label className="block mb-1">Date</Label>
                    <Input type="datetime-local" value={(editing.date || '').slice(0,16)} onChange={(e) => onField('date', new Date(e.target.value).toISOString())} />
                  </div>
                </div>
                <div>
                  <Label className="block mb-1">Tags (comma separated)</Label>
                  <Input value={(editing.tags || []).join(', ')} onChange={(e) => onTagChange(e.target.value)} placeholder="devotional, testimony" />
                </div>
                <div>
                  <Label className="block mb-1">Status</Label>
                  <select value={editing.status || 'published'} onChange={(e) => onField('status', e.target.value as any)} className="rounded-md border border-gray-300 px-3 py-2 bg-white">
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!editing.isFeatured} onChange={(e) => onField('isFeatured', e.target.checked)} />
                    Featured
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!editing.isNews} onChange={(e) => onField('isNews', e.target.checked)} />
                    News
                  </label>
                </div>
              </div>
              <div>
                <Label className="block mb-1">Content</Label>
                <WysiwygEditor value={editing.contentHtml} onChange={(html) => onField('contentHtml', html)} className="mb-2" />
                <p className="text-xs text-gray-500">Tip: Use the toolbar to format. Images/videos can be uploaded via fields above and embedded as needed.</p>
              </div>
            </div>
          </FadeUp>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminBlogPage, [UserRole.MINISTER, UserRole.ADMIN]);
