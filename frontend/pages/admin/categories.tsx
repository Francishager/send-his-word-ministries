import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import FadeUp from '@/components/ux/FadeUp';

interface Category {
  id: string;
  name: string;
}

function AdminCategoriesPage() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<Category>({ id: '', name: '' });
  const dragIndex = React.useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/categories');
      const j = await r.json();
      setItems(j?.categories || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const add = () => {
    if (!draft.id || !draft.name) return;
    if (items.some((c) => c.id === draft.id)) {
      alert('Category id already exists');
      return;
    }
    setItems((prev) => [...prev, { ...draft }]);
    setDraft({ id: '', name: '' });
  };

  const remove = (id: string) => setItems((prev) => prev.filter((c) => c.id !== id));
  const update = (idx: number, patch: Partial<Category>) =>
    setItems((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  // DnD handlers
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
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: items }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save');
      alert('Saved categories');
    } catch (e: any) {
      alert(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Categories">
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        <FadeUp>
          <div className="rounded-lg border p-4 bg-white">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="block mb-1">ID (slug)</Label>
                <Input
                  value={draft.id}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      id: e.target.value
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]+/g, '-'),
                    }))
                  }
                  placeholder="devotionals"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="block mb-1">Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Devotionals"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button variant="secondary" onClick={add}>
                Add Category
              </Button>
            </div>
          </div>
        </FadeUp>

        <div className="mt-6">
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c, idx) => (
                    <tr
                      key={c.id}
                      className="border-t cursor-move"
                      draggable
                      onDragStart={onDragStart(idx)}
                      onDragOver={onDragOver(idx)}
                      onDrop={onDrop(idx)}
                    >
                      <td className="px-3 py-2 text-gray-700">{c.id}</td>
                      <td className="px-3 py-2">
                        <Input
                          value={c.name}
                          onChange={(e) => update(idx, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="outline" onClick={() => remove(c.id)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminCategoriesPage, [UserRole.MINISTER, UserRole.ADMIN]);
