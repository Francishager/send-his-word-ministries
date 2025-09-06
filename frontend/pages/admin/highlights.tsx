import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface HL { src: string; title?: string; subtitle?: string; }

function AdminHighlights() {
  const { success, error } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [items, setItems] = React.useState<HL[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/highlights');
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to load');
      setItems(j.highlights || []);
    } catch (e: any) {
      error(e?.message || 'Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const updateItem = (idx: number, patch: Partial<HL>) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { src: '', title: '', subtitle: '' }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/highlights', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ highlights: items }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save');
      success('Highlights saved');
    } catch (e: any) {
      error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Highlights">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Past Highlights</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addItem}>Add</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-6">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-lg border p-4 bg-white">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <Label className="block mb-1">Image src</Label>
                    <Input value={it.src} onChange={(e) => updateItem(idx, { src: e.target.value })} placeholder="/images/hero/home_hero_1.JPG" />
                    {it.src && (
                      <div className="mt-2">
                        <img src={it.src} alt={it.title || 'Highlight'} className="w-full h-32 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1">Title</Label>
                    <Input value={it.title || ''} onChange={(e) => updateItem(idx, { title: e.target.value })} placeholder="Worship Night" />
                  </div>
                  <div>
                    <Label className="block mb-1">Subtitle</Label>
                    <Input value={it.subtitle || ''} onChange={(e) => updateItem(idx, { subtitle: e.target.value })} placeholder="A powerful time in God's presence" />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="outline" onClick={() => removeItem(idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminHighlights, [UserRole.MINISTER, UserRole.ADMIN]);
