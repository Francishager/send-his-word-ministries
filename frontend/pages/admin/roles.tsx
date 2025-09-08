import React from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type Role = { id: number; name: string; description?: string; permissions?: Record<string, any> };

function AdminRolesPage() {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [perms, setPerms] = React.useState<Record<string, any>>({});

  const fetchRoles = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/roles/`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load roles (${res.status})`);
      const json = await res.json();
      setRoles(Array.isArray(json) ? json : json.results || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Load current user permissions to gate page
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me/`, { credentials: 'include' });
        if (!res.ok) return;
        const j = await res.json();
        setPerms(j?.permissions || {});
      } catch {}
    })();
  }, []);

  const createRole = async (name: string, description: string, permissions: Record<string, any>) => {
    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/users/roles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description, permissions }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || j?.error || 'Failed to create role');
      await fetchRoles();
      alert('Role created');
    } catch (e: any) {
      alert(e?.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const savePermissions = async (roleId: number, permissions: any) => {
    try {
      const res = await fetch(`${API_BASE}/users/roles/${roleId}/permissions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || j?.error || 'Failed to save permissions');
      alert('Permissions saved');
    } catch (e: any) {
      alert(e?.message || 'Failed to save permissions');
    }
  };

  const commonPerms = [
    { key: 'services_manage', label: 'Manage Services' },
    { key: 'donations_manage', label: 'Manage Donations' },
    { key: 'giving_manage', label: 'Manage Giving' },
    { key: 'users_manage', label: 'Manage Users' },
    { key: 'roles_manage', label: 'Manage Roles' },
    { key: 'reporting_read', label: 'View Reports/System' },
  ];

  return (
    <>
      <Head>
        <title>Roles & Permissions - Admin</title>
      </Head>
      <AdminLayout title="Roles & Permissions">
        {!perms.roles_manage && (
          <div className="rounded border border-yellow-300 bg-yellow-50 text-yellow-800 px-3 py-2 mb-4">You are not authorized to manage roles.</div>
        )}
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <div className="mb-6 rounded border bg-white p-4">
          <h2 className="font-semibold mb-3">Create Role</h2>
          <form onSubmit={(e)=>{
              e.preventDefault();
              const f=e.currentTarget as HTMLFormElement;
              const name=(f.elements.namedItem('name') as HTMLInputElement).value;
              const description=(f.elements.namedItem('description') as HTMLInputElement).value;
              // collect checkboxes
              const check = (id: string) => (f.elements.namedItem(id) as HTMLInputElement)?.checked || false;
              const permissions: Record<string, any> = {
                services_manage: check('perm_services_manage'),
                donations_manage: check('perm_donations_manage'),
                giving_manage: check('perm_giving_manage'),
                users_manage: check('perm_users_manage'),
                roles_manage: check('perm_roles_manage'),
                reporting_read: check('perm_reporting_read'),
              };
              createRole(name, description, permissions);
              f.reset();
            }} className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-sm mb-1">Name</label>
                <input name="name" required className="w-full rounded border px-3 py-2 text-sm" placeholder="MINISTER" />
              </div>
              <div className="flex-[2] min-w-[260px]">
                <label className="block text-sm mb-1">Description</label>
                <input name="description" className="w-full rounded border px-3 py-2 text-sm" placeholder="Can manage services and content" />
              </div>
              <button disabled={creating} className="self-end rounded bg-gray-900 text-white text-sm px-3 py-2">{creating ? 'Creating…' : 'Create'}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded border p-3">
                <div className="font-semibold mb-2 text-sm">Services</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_services_manage" /> Manage Services</label>
              </div>
              <div className="rounded border p-3">
                <div className="font-semibold mb-2 text-sm">Giving & Donations</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_giving_manage" /> Manage Giving</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_donations_manage" /> Manage Donations</label>
              </div>
              <div className="rounded border p-3">
                <div className="font-semibold mb-2 text-sm">Users & Roles</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_users_manage" /> Manage Users</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_roles_manage" /> Manage Roles</label>
              </div>
              <div className="rounded border p-3">
                <div className="font-semibold mb-2 text-sm">Reporting</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="perm_reporting_read" /> View Reports/System</label>
              </div>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Permissions (JSON)</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => {
                const perms = r.permissions || {};
                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-gray-600">{r.description || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="mb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {commonPerms.map((p)=> (
                          <label key={p.key} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              defaultChecked={!!perms[p.key]}
                              onChange={(e)=>{
                                const area = document.getElementById(`perm-${r.id}`) as HTMLTextAreaElement | null;
                                if (!area) return;
                                try {
                                  const json = JSON.parse(area.value || '{}');
                                  json[p.key] = e.target.checked;
                                  area.value = JSON.stringify(json, null, 2);
                                } catch {}
                              }}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                      <div className="text-xs font-semibold mb-1">Advanced (JSON)</div>
                      <textarea defaultValue={JSON.stringify(perms, null, 2)} id={`perm-${r.id}`} rows={8} className="w-full rounded border px-3 py-2 font-mono text-xs" />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded bg-gray-900 text-white text-xs px-3 py-1"
                        onClick={() => {
                          const area = document.getElementById(`perm-${r.id}`) as HTMLTextAreaElement | null;
                          if (!area) return;
                          try {
                            const val = JSON.parse(area.value || '{}');
                            savePermissions(r.id, val);
                          } catch (e: any) {
                            alert('Invalid JSON');
                          }
                        }}
                      >Save</button>
                    </td>
                  </tr>
                );
              })}
              {!roles.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>No roles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </>
  );
}

export default withAuth(AdminRolesPage);
