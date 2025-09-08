import React from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type Role = { id: number; name: string; description?: string };

type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  date_joined: string;
  roles: Role[];
};

function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [perms, setPerms] = React.useState<Record<string, any>>({});
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (q.trim()) params.set('q', q.trim());
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const [uRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/users/users/${params.toString() ? `?${params}` : ''}`, { credentials: 'include' }),
        fetch(`${API_BASE}/users/roles/`, { credentials: 'include' }),
      ]);
      if (!uRes.ok) throw new Error(`Failed to load users (${uRes.status})`);
      if (!rRes.ok) throw new Error(`Failed to load roles (${rRes.status})`);
      const usersJson = await uRes.json();
      const rolesJson = await rRes.json();
      const list = Array.isArray(usersJson) ? usersJson : (usersJson.results || []);
      setUsers(list);
      setRoles(Array.isArray(rolesJson) ? rolesJson : (rolesJson.results || []));
      // Update total pages if count provided
      const cnt = Array.isArray(usersJson) ? list.length : (usersJson.count ?? list.length);
      setTotalCount(cnt);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, q, page, pageSize]);

  const [totalCount, setTotalCount] = React.useState(0);
  React.useEffect(() => { fetchData(); }, [fetchData]);

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

  const assignRole = async (userId: number, roleName: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/users/assign-role/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, role_name: roleName }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || j?.error || 'Failed to assign role');
      await fetchData();
      alert('Role assigned');
    } catch (e: any) {
      alert(e?.message || 'Failed to assign role');
    }
  };

  const serverExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`${API_BASE}/users/users/export.csv?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `users_export_${new Date().toISOString()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Failed to export');
    }
  };

  const removeRole = async (userId: number, roleName: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/users/${userId}/roles/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: roleName }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.detail || j?.error || 'Failed to remove role');
      await fetchData();
      alert('Role removed');
    } catch (e: any) {
      alert(e?.message || 'Failed to remove role');
    }
  };

  const exportCsv = () => {
    const headers = ['id','name','email','roles','active','joined'];
    const filtered = users.filter((u)=>{
      const term = q.trim().toLowerCase();
      if (!term) return true;
      return (
        (u.email || '').toLowerCase().includes(term) ||
        ((u.first_name || '').toLowerCase() + ' ' + (u.last_name || '').toLowerCase()).includes(term)
      );
    });
    const rows = filtered.map(u => [
      String(u.id),
      ((u.first_name || '') + ' ' + (u.last_name || '')).trim(),
      u.email,
      (u.roles || []).map(r=>r.name).join('|'),
      u.is_active ? 'true' : 'false',
      new Date(u.date_joined).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'\"')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_${new Date().toISOString()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      <Head>
        <title>Users & Roles - Admin</title>
      </Head>
      <AdminLayout title="Users & Roles">
        {!perms.users_manage && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 px-3 py-2">You are not authorized to manage users.</div>
        )}
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm mb-1">Search</label>
            <input value={q} onChange={(e)=>setQ(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Name or email" />
          </div>
          <div>
            <label className="block text-sm mb-1">Filter by Role</label>
            <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} className="rounded border px-3 py-2 text-sm">
              <option value="">All</option>
              {roles.map((r)=> (<option key={r.id} value={r.name}>{r.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Page Size</label>
            <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}} className="rounded border px-3 py-2 text-sm">
              {[10,20,50,100].map(n=> (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <button onClick={()=>{ setPage(1); fetchData(); }} className="rounded bg-gray-900 text-white text-sm px-3 py-2">Apply</button>
          <button onClick={exportCsv} className="rounded bg-indigo-600 text-white text-sm px-3 py-2">Export CSV</button>
          <button onClick={serverExportCsv} className="rounded bg-indigo-600 text-white text-sm px-3 py-2">Server Export</button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Roles</th>
                <th className="px-3 py-2 text-left">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {users
                .map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {u.roles?.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-2 rounded bg-gray-100 text-gray-800 px-2 py-0.5 text-xs">
                          {r.name}
                          {perms.users_manage && (
                            <button onClick={()=>removeRole(u.id, r.name)} className="text-red-600 hover:text-red-800" title="Remove role">✕</button>
                          )}
                        </span>
                      ))}
                      {!u.roles?.length && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {perms.users_manage && (
                      <div className="flex items-center gap-2">
                        <select className="rounded border px-2 py-1 text-sm" id={`role-${u.id}`}>
                          {roles.map((r) => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const sel = document.getElementById(`role-${u.id}`) as HTMLSelectElement | null;
                            if (!sel) return;
                            assignRole(u.id, sel.value);
                          }}
                          className="rounded bg-gray-900 text-white text-xs px-2 py-1"
                        >Assign</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} of {totalPages} • {totalCount} total</div>
          <div className="flex items-center gap-2">
            <button
              onClick={()=>setPage(p=>Math.max(1, p-1))}
              disabled={page<=1}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >Previous</button>
            <button
              onClick={()=>setPage(p=>Math.min(totalPages, p+1))}
              disabled={page>=totalPages}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export default withAuth(AdminUsersPage);
