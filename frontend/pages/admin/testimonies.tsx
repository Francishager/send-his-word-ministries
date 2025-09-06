import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FadeUp from '@/components/ux/FadeUp';
import { supabase } from '@/lib/supabaseClient';

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

function AdminTestimoniesPage() {
  const [items, setItems] = React.useState<TestimonyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const dragIndex = React.useRef<number | null>(null);
  const [filter, setFilter] = React.useState<'all'|'pending'|'approved'>('all');
  const [editing, setEditing] = React.useState<TestimonyItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonies')
        .select('*')
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

  React.useEffect(() => { load(); }, []);

  const toggleApprove = (idx: number) => setItems((prev) => prev.map((t, i) => i === idx ? ({ ...t, approved: !t.approved }) : t));
  const remove = (id: string) => setItems((prev) => prev.filter((t) => t.id !== id));
  const openEdit = (t: TestimonyItem) => setEditing({ ...t });
  const applyEdit = () => {
    if (!editing) return;
    setItems((prev) => prev.map((t) => t.id === editing.id ? { ...editing } : t));
    setEditing(null);
  };

  // DnD handlers
  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index; e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (index: number) => (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current; dragIndex.current = null;
    if (from == null || from === index) return;
    setItems((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      // Recompute priority based on current order
      const withPriority = items.map((t, i) => ({ ...t, priority: i }));
      // Batch upsert
      const { error } = await supabase.from('testimonies').upsert(withPriority, { onConflict: 'id' });
      if (error) throw error;
      alert('Saved changes');
      setItems(withPriority);
    } catch (e: any) {
      alert(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((t) => {
    if (filter === 'approved') return t.approved === true;
    if (filter === 'pending') return !t.approved;
    return true;
  });

  return (
    <MainLayout title="Admin · Testimonies">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Testimonies</h1>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </div>

        <FadeUp>
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Approved</th>
                    <th className="px-3 py-2">Image</th>
                    <th className="px-3 py-2">Video</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, idx) => (
                    <tr key={t.id}
                      className="border-t cursor-move"
                      draggable
                      onDragStart={onDragStart(idx)}
                      onDragOver={onDragOver(idx)}
                      onDrop={onDrop(idx)}
                    >
                      <td className="px-3 py-2 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 font-medium max-w-[280px] truncate" title={t.title}>{t.title}</td>
                      <td className="px-3 py-2 text-gray-700">{t.name}</td>
                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={!!t.approved} onChange={() => toggleApprove(idx)} />
                          {t.approved ? 'Yes' : 'No'}
                        </label>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{t.imageUrl ? 'Yes' : '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{t.videoUrl ? 'Yes' : '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => openEdit(t)}>Edit</Button>
                          <Button variant="outline" onClick={() => remove(t.id)}>Remove</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FadeUp>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4">
              <h3 className="text-lg font-semibold mb-3">Edit Testimony</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Title</label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...(editing as TestimonyItem), title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...(editing as TestimonyItem), name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Content</label>
                  <textarea value={editing.content} onChange={(e) => setEditing({ ...(editing as TestimonyItem), content: e.target.value })} rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Image URL</label>
                  <Input value={editing.imageUrl || ''} onChange={(e) => setEditing({ ...(editing as TestimonyItem), imageUrl: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Video URL</label>
                  <Input value={editing.videoUrl || ''} onChange={(e) => setEditing({ ...(editing as TestimonyItem), videoUrl: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={applyEdit}>Apply</Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminTestimoniesPage, [UserRole.MINISTER, UserRole.ADMIN]);
