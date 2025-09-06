import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { withAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { supabase } from '@/lib/supabaseClient';
import FadeUp from '@/components/ux/FadeUp';

interface ServiceRow { id: string; title: string | null }
interface CountdownRow {
  id: string;
  title: string;
  target_time: string;
  active: boolean;
  service_id: string | null;
  created_at?: string;
}

function AdminCountdownsPage() {
  const [items, setItems] = React.useState<CountdownRow[]>([]);
  const [services, setServices] = React.useState<ServiceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    target_time: '', // ISO string from input datetime-local
    service_id: '' as string | '',
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cds, error: e1 }, { data: svs, error: e2 }] = await Promise.all([
        supabase.from('countdowns').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('id,title').order('start_time', { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setItems((cds || []) as any);
      setServices((svs || []) as any);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const createCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.title.trim()) throw new Error('Title is required');
      if (!form.target_time) throw new Error('Target time is required');
      const payload = {
        title: form.title.trim(),
        target_time: new Date(form.target_time).toISOString(),
        active: form.active,
        service_id: form.service_id || null,
      };
      const { data, error } = await supabase.from('countdowns').insert(payload).select('*').single();
      if (error) throw error;
      setItems((prev) => [data as any, ...prev]);
      setForm({ title: '', target_time: '', service_id: '', active: true });
      // eslint-disable-next-line no-alert
      alert('Countdown created');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('countdowns').update({ active }).eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this countdown?')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('countdowns').delete().eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as any)?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Admin · Countdowns">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Countdowns</h1>

        <FadeUp className="rounded-xl border bg-white p-4 mb-6">
          <h2 className="font-semibold mb-3">Create New</h2>
          <form onSubmit={createCountdown} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={form.title} onChange={(e) => on('title', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Time</label>
              <input type="datetime-local" value={form.target_time} onChange={(e) => on('target_time', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service (optional)</label>
              <select value={form.service_id} onChange={(e) => on('service_id', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">— None —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.title || s.id}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => on('active', e.target.checked)} /> Active
              </label>
            </div>
            <div className="sm:col-span-2">
              <button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{saving ? 'Saving…' : 'Create'}</button>
            </div>
          </form>
        </FadeUp>

        <FadeUp className="rounded-xl border bg-white p-4">
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">No countdowns yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{c.title}</td>
                      <td className="px-3 py-2 text-gray-600">{new Date(c.target_time).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{services.find((s) => s.id === c.service_id)?.title || '—'}</td>
                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={c.active} onChange={(e) => toggleActive(c.id, e.target.checked)} />
                        </label>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => remove(c.id)} disabled={saving}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FadeUp>
      </section>
    </MainLayout>
  );
}

export default withAuth(AdminCountdownsPage, [UserRole.MINISTER, UserRole.ADMIN]);
