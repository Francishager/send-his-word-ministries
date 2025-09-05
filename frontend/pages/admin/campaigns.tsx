import React from 'react';
import { withAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layout/PortalLayout';
import { UserRole } from '@/types/user';
import { campaignsApi, CampaignDTO, CampaignInput } from '@/lib/campaigns';

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 8l-4-4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z"/></svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M8 3.13a4 4 0 1 0 0 7.75M12 14a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z"/></svg>
);
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V3m4 18V3m-8 10v8M3 21h18"/></svg>
);
const CampaignIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
);

function CampaignModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial?: Partial<CampaignDTO>; onSave: (data: CampaignInput, id?: string) => Promise<void>; }) {
  const [title, setTitle] = React.useState(initial?.title || '');
  const [description, setDescription] = React.useState(initial?.description || '');
  const [goal, setGoal] = React.useState<number>(initial?.goal_amount ? Number(initial.goal_amount) : 0);
  const [status, setStatus] = React.useState(initial?.status || 'active');
  const [start, setStart] = React.useState(initial?.start_date || '');
  const [end, setEnd] = React.useState(initial?.end_date || '');
  React.useEffect(() => {
    setTitle(initial?.title || '');
    setDescription((initial?.description as string) || '');
    setGoal(initial?.goal_amount ? Number(initial.goal_amount) : 0);
    setStatus(initial?.status || 'active');
    setStart(initial?.start_date || '');
    setEnd(initial?.end_date || '');
  }, [initial]);
  if (!open) return null;
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ title, description, goal_amount: goal, status, start_date: start || null, end_date: end || null }, initial?.id);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="px-4 py-3 border-b font-semibold">{initial?.id ? 'Edit Campaign' : 'New Campaign'}</div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Goal Amount</label>
              <input type="number" min={0} step="0.01" className="mt-1 w-full rounded border px-3 py-2" value={goal} onChange={(e) => setGoal(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" value={start || ''} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" value={end || ''} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminCampaigns() {
  const navItems = [
    { name: 'Services', href: '/admin/services', icon: CalendarIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Moderation', href: '/admin/moderation', icon: ChatIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Users & Roles', href: '/admin/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Campaigns', href: '/admin/campaigns', icon: CampaignIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
  ];

  const [items, setItems] = React.useState<CampaignDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CampaignDTO | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.list();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const onNew = () => { setEditing(undefined); setModalOpen(true); };
  const onEdit = (c: CampaignDTO) => { setEditing(c); setModalOpen(true); };
  const onDelete = async (c: CampaignDTO) => {
    if (!confirm(`Delete campaign "${c.title}"?`)) return;
    await campaignsApi.remove(c.id);
    await load();
  };
  const onSave = async (data: CampaignInput, id?: string) => {
    if (id) await campaignsApi.update(id, data); else await campaignsApi.create(data);
    setModalOpen(false);
    await load();
  };

  return (
    <PortalLayout userRole={UserRole.ADMIN} navItems={navItems} title="Minister / Admin Portal">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Donation Campaigns</h1>
          <button onClick={onNew} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium">New Campaign</button>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 p-3">{error}</div>}
        <div className="rounded-md border bg-white">
          <div className="p-4 border-b font-medium">Campaigns</div>
          {loading ? (
            <div className="p-4 text-gray-600">Loading…</div>
          ) : (
            <div className="divide-y">
              {items.length === 0 && <div className="p-4 text-gray-600">No campaigns found.</div>}
              {items.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-gray-600">Status: {c.status} · Goal: ${Number(c.goal_amount).toLocaleString()}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => onEdit(c)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => onDelete(c)} className="px-3 py-1 rounded border">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <CampaignModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSave={onSave} />
    </PortalLayout>
  );
}

export default withAuth(AdminCampaigns, [UserRole.MINISTER, UserRole.ADMIN]);
