import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface StoryItem {
  src: string;
  name: string;
  quote: string;
  focus?: string;
}

function AdminStories() {
  const { success, error } = useToast();
  const [stories, setStories] = React.useState<StoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories');
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to load');
      setStories(j.stories);
    } catch (e: any) {
      error(e?.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const updateItem = (idx: number, patch: Partial<StoryItem>) => {
    setStories((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addItem = () =>
    setStories((prev) => [...prev, { src: '', name: '', quote: '', focus: '50% 30%' }]);
  const removeItem = (idx: number) => setStories((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save');
      success('Stories saved');
    } catch (e: any) {
      error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Stories">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Stories of Impact</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addItem}>
              Add Story
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-6">
            {stories.map((s, idx) => (
              <div key={idx} className="rounded-lg border p-4 bg-white">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block mb-1">Image src</Label>
                    <Input
                      value={s.src}
                      onChange={(e) => updateItem(idx, { src: e.target.value })}
                      placeholder="/images/hero/home_hero_1.JPG"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">Focus (object-position)</Label>
                    <Input
                      value={s.focus || ''}
                      onChange={(e) => updateItem(idx, { focus: e.target.value })}
                      placeholder="50% 30%"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">Name</Label>
                    <Input
                      value={s.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label className="block mb-1">Quote</Label>
                    <Input
                      value={s.quote}
                      onChange={(e) => updateItem(idx, { quote: e.target.value })}
                      placeholder="Testimony"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button variant="outline" onClick={() => removeItem(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminStories, [UserRole.MINISTER, UserRole.ADMIN]);
