import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface MomentData {
  title: string;
  message: string;
  ctaText?: string;
  ctaHref?: string;
  image?: string;
  videoUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

function AdminMoment() {
  const { success, error } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<MomentData>({ title: '', message: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moment');
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to load');
      setForm(j.moment || { title: '', message: '' });
    } catch (e: any) {
      error(e?.message || 'Failed to load moment');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const onChange = (patch: Partial<MomentData>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/moment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moment: form }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save');
      success('Service Moment updated');
    } catch (e: any) {
      error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Service Moment">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Service Moment Billboard</h1>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <div className="space-y-4 bg-white rounded-xl border p-4">
            <div>
              <Label className="block mb-1">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="This Sunday: Healing & Hope"
              />
            </div>
            <div>
              <Label className="block mb-1">Message</Label>
              <Input
                value={form.message}
                onChange={(e) => onChange({ message: e.target.value })}
                placeholder="Invite someone who needs encouragement today."
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-1">CTA Text</Label>
                <Input
                  value={form.ctaText || ''}
                  onChange={(e) => onChange({ ctaText: e.target.value })}
                  placeholder="Invite Someone"
                />
              </div>
              <div>
                <Label className="block mb-1">CTA Href</Label>
                <Input
                  value={form.ctaHref || ''}
                  onChange={(e) => onChange({ ctaHref: e.target.value })}
                  placeholder="/auth/login"
                />
              </div>
            </div>
            <div>
              <Label className="block mb-1">Video Url (YouTube / Shorts)</Label>
              <Input
                value={form.videoUrl || ''}
                onChange={(e) => onChange({ videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/shorts/XXXXX"
              />
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.autoplay}
                    onChange={(e) => onChange({ autoplay: e.target.checked })}
                  />
                  Autoplay
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.muted !== false}
                    onChange={(e) => onChange({ muted: e.target.checked })}
                  />
                  Muted
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.loop}
                    onChange={(e) => onChange({ loop: e.target.checked })}
                  />
                  Loop
                </label>
              </div>
            </div>
            <div>
              <Label className="block mb-1">Image Path</Label>
              <Input
                value={form.image || ''}
                onChange={(e) => onChange({ image: e.target.value })}
                placeholder="/images/hero/home_hero_3.JPG"
              />
              {form.image && (
                <div className="mt-3">
                  <img
                    src={form.image}
                    alt="Moment Preview"
                    className="w-full h-40 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Tip: Place images under <code>/public/images/</code> for best performance.
            </div>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminMoment, [UserRole.MINISTER, UserRole.ADMIN]);
