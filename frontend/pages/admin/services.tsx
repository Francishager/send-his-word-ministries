import React from 'react';
import { withAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layout/PortalLayout';
import { UserRole } from '@/types/user';
import { servicesApi, ServiceDTO, ServiceInput } from '@/lib/services';

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 8l-4-4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z" />
  </svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M8 3.13a4 4 0 1 0 0 7.75M12 14a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
  </svg>
);
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V3m4 18V3m-8 10v8M3 21h18" />
  </svg>
);
const CampaignIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);

function ServiceModal({ open, onClose, initial, onSave }: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ServiceDTO>;
  onSave: (data: ServiceInput, id?: string) => Promise<void>;
}) {
  const [title, setTitle] = React.useState(initial?.title || '');
  const [description, setDescription] = React.useState<string>((initial?.description as string) || '');
  const [status, setStatus] = React.useState(initial?.status || 'wait');
  const [start, setStart] = React.useState(initial?.start_time || '');
  const [end, setEnd] = React.useState(initial?.end_time || '');
  const [provider, setProvider] = React.useState(initial?.stream_provider || 'youtube');
  const [embedUrl, setEmbedUrl] = React.useState<string>((initial?.stream_embed_url as string) || '');
  const [sourceId, setSourceId] = React.useState<string>((initial?.stream_source_id as string) || '');

  React.useEffect(() => {
    setTitle(initial?.title || '');
    setDescription((initial?.description as string) || '');
    setStatus(initial?.status || 'wait');
    setStart(initial?.start_time || '');
    setEnd(initial?.end_time || '');
    setProvider(initial?.stream_provider || 'youtube');
    setEmbedUrl((initial?.stream_embed_url as string) || '');
    setSourceId((initial?.stream_source_id as string) || '');
  }, [initial]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ServiceInput = {
      title,
      description: description || null,
      status,
      start_time: start || null,
      end_time: end || null,
      stream_provider: provider || null,
      stream_embed_url: embedUrl || null,
      stream_source_id: sourceId || null,
    };
    await onSave(payload, initial?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="px-4 py-3 border-b font-semibold">
          {initial?.id ? 'Edit Service' : 'New Service'}
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="wait">wait</option>
                <option value="started">started</option>
                <option value="ended">ended</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Start Time</label>
              <input type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" value={start || ''} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">End Time</label>
              <input type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" value={end || ''} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Stream Provider</label>
              <select className="mt-1 w-full rounded border px-3 py-2" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Embed URL</label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="e.g. https://www.youtube.com/embed/VIDEO_ID" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Source ID (optional)</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="e.g. VIDEO_ID" />
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

function AdminServices() {
  const navItems = [
    { name: 'Services', href: '/admin/services', icon: CalendarIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Moderation', href: '/admin/moderation', icon: ChatIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Users & Roles', href: '/admin/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Campaigns', href: '/admin/campaigns', icon: CampaignIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
  ];

  const [items, setItems] = React.useState<ServiceDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ServiceDTO | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicesApi.list();
      // Order by start_time ascending when present
      data.sort((a, b) => {
        const ta = a.start_time ? new Date(a.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.start_time ? new Date(b.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const onNew = () => { setEditing(undefined); setModalOpen(true); };
  const onEdit = (s: ServiceDTO) => { setEditing(s); setModalOpen(true); };
  const onDelete = async (s: ServiceDTO) => {
    if (!confirm(`Delete service "${s.title}"?`)) return;
    await servicesApi.remove(s.id);
    await load();
  };
  const onSave = async (data: ServiceInput, id?: string) => {
    if (id) await servicesApi.update(id, data);
    else await servicesApi.create(data);
    setModalOpen(false);
    await load();
  };

  return (
    <PortalLayout userRole={UserRole.ADMIN} navItems={navItems} title="Minister / Admin Portal">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Services</h1>
          <button onClick={onNew} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white font-medium">New Service</button>
        </div>
        {error && (<div className="rounded border border-red-200 bg-red-50 text-red-700 p-3">{error}</div>)}
        <div className="rounded-md border bg-white">
          <div className="p-4 border-b font-medium">Upcoming & Recent Services</div>
          {loading ? (
            <div className="p-4 text-gray-600">Loading…</div>
          ) : (
            <div className="divide-y">
              {items.length === 0 && <div className="p-4 text-gray-600">No services found.</div>}
              {items.map((s) => (
                <div key={s.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5">
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-gray-600">Status: {s.status || 'wait'}</div>
                  </div>
                  <div className="md:col-span-4 text-sm text-gray-600">
                    <div>Start: {s.start_time ? new Date(s.start_time).toLocaleString() : '—'}</div>
                    <div>End: {s.end_time ? new Date(s.end_time).toLocaleString() : '—'}</div>
                  </div>
                  <div className="md:col-span-3 text-sm text-gray-600">
                    <div>Provider: {s.stream_provider || '—'}</div>
                    <div className="truncate" title={s.stream_embed_url || ''}>Embed: {s.stream_embed_url || '—'}</div>
                  </div>
                  <div className="md:col-span-12 md:justify-self-end space-x-2">
                    <button onClick={() => onEdit(s)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => onDelete(s)} className="px-3 py-1 rounded border">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ServiceModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSave={onSave} />
    </PortalLayout>
  );
}

export default withAuth(AdminServices, [UserRole.MINISTER, UserRole.ADMIN]);
