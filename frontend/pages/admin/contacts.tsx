import React from 'react';
import Head from 'next/head';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type ContactRow = {
  id: string;
  created_at: string;
  name?: string | null;
  email?: string | null;
  message?: string | null;
  ip?: string | null;
};

function AdminContactsPage() {
  const [items, setItems] = React.useState<ContactRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${API_BASE}/core/admin/contacts?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load contacts (${res.status})`);
      const json = await res.json();
      setItems(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const markReviewed = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/core/admin/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to update');
      // refresh one row locally
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, reviewed: true, reviewed_at: new Date().toISOString() } as any : it)));
    } catch (e: any) {
      alert(e?.message || 'Failed to update');
    }
  };

  const exportCsv = () => {
    const headers = ['id','created_at','name','email','ip','message','reviewed','reviewed_at','reviewer_id'];
    const rows = items.map((it:any)=>[
      it.id,
      it.created_at,
      it.name || '',
      it.email || '',
      it.ip || '',
      (it.message || '').replace(/\r?\n/g,' '),
      (it.reviewed ? 'true':'false'),
      it.reviewed_at || '',
      it.reviewer_id || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r=>r.map((v)=>`"${String(v).replace(/"/g,'\"')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Head>
        <title>Contact Submissions - Admin</title>
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Contact Submissions</h1>
          <div className="flex items-center gap-2">
            <input type="datetime-local" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded border px-2 py-1 text-sm" />
            <span className="text-gray-500">to</span>
            <input type="datetime-local" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded border px-2 py-1 text-sm" />
            <button onClick={fetchData} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">Apply</button>
            <button onClick={exportCsv} className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-gray-800">Export CSV</button>
          </div>
        </div>
        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">IP</th>
                <th className="px-3 py-2 text-left">Message</th>
                <th className="px-3 py-2 text-left">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2 text-gray-600">{new Date(it.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{it.name || '—'}</td>
                  <td className="px-3 py-2">{it.email || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{it.ip || '—'}</td>
                  <td className="px-3 py-2 max-w-xl whitespace-pre-wrap break-words">{it.message || '—'}</td>
                  <td className="px-3 py-2">
                    {(it as any).reviewed ? (
                      <span className="inline-block rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">Reviewed</span>
                    ) : (
                      <button onClick={() => markReviewed(it.id)} className="rounded bg-gray-800 text-white px-2 py-1 text-xs hover:bg-gray-700">Mark reviewed</button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>No submissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

export default withAuth(AdminContactsPage);
