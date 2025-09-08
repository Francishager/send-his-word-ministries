import React from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function AdminSystemPage() {
  const [rates, setRates] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [perms, setPerms] = React.useState<Record<string, any>>({});

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/core/admin/system`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load system settings (${res.status})`);
      const json = await res.json();
      setRates(json?.throttle_rates || {});
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);
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

  const entries = Object.entries(rates);

  return (
    <>
      <Head>
        <title>System Settings - Admin</title>
      </Head>
      <AdminLayout title="System Settings">
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <div className="mb-6 rounded border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Maintenance</h2>
            <button onClick={fetchData} className="rounded bg-gray-900 text-white text-xs px-2 py-1">Reload</button>
          </div>
          <p className="text-sm text-gray-600 mb-3">Run a manual refresh of reporting materialized views.</p>
          {perms.reporting_read ? (
            <button
              disabled={refreshing}
              onClick={async ()=>{
                try {
                  setRefreshing(true);
                  const res = await fetch(`${API_BASE}/core/reports/refresh`, { method: 'POST', credentials: 'include' });
                  if (!res.ok) throw new Error(`Failed (${res.status})`);
                  alert('Reporting views refreshed');
                } catch (e: any) {
                  alert(e?.message || 'Failed to refresh');
                } finally {
                  setRefreshing(false);
                }
              }}
              className="rounded bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500"
            >{refreshing ? 'Refreshing…' : 'Refresh Reporting Views'}</button>
          ) : (
            <div className="text-xs text-gray-500">You don't have permission to run maintenance actions.</div>
          )}
        </div>

        <div className="rounded border bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">DRF Throttle Rates</h2>
            <button onClick={fetchData} className="rounded bg-gray-900 text-white text-xs px-2 py-1">Refresh</button>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Scope</th>
                <th className="px-3 py-2 text-left">Rate</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k,v]) => (
                <tr key={k} className="border-t">
                  <td className="px-3 py-2 font-medium">{k}</td>
                  <td className="px-3 py-2">{v}</td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={2}>No throttle settings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </>
  );
}

export default withAuth(AdminSystemPage);
