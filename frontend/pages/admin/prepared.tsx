import React from 'react';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type GivingRow = {
  id: string;
  user_id?: string | null;
  amount: number;
  giving_type: 'tithe' | 'offering' | string;
  method?: string | null;
  status: string;
  created_at: string;
};

type DonationRow = {
  id: string;
  user_id?: string | null;
  amount: number;
  donation_type: 'partner' | 'project' | 'mission' | string;
  status: string;
  campaign_id?: string | null;
  created_at: string;
};

export default function PreparedAdminPage() {
  const [givings, setGivings] = React.useState<GivingRow[]>([]);
  const [donations, setDonations] = React.useState<DonationRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/core/giving/?status=pending`, { credentials: 'include' }),
        fetch(`${API_BASE}/core/donations/?status=pending`, { credentials: 'include' }),
      ]);
      if (!gRes.ok) throw new Error(`Failed to load givings (${gRes.status})`);
      if (!dRes.ok) throw new Error(`Failed to load donations (${dRes.status})`);
      const gJson = await gRes.json();
      const dJson = await dRes.json();
      setGivings(Array.isArray(gJson) ? gJson : gJson?.results || []);
      setDonations(Array.isArray(dJson) ? dJson : dJson?.results || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Head>
        <title>Prepared Payments - Admin</title>
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Prepared Entries (Pending)</h1>
          <button onClick={fetchData} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">Refresh</button>
        </div>
        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-2">Giving (Tithe/Offering)</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {givings.map((g) => (
                  <tr key={g.id} className="border-t">
                    <td className="px-3 py-2 text-gray-600">{new Date(g.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-xs">{g.id}</td>
                    <td className="px-3 py-2 text-gray-600">{g.user_id || '—'}</td>
                    <td className="px-3 py-2">{g.giving_type}</td>
                    <td className="px-3 py-2">{g.amount}</td>
                    <td className="px-3 py-2 text-gray-600">{g.method || '—'}</td>
                    <td className="px-3 py-2">{g.status}</td>
                  </tr>
                ))}
                {!givings.length && (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>No prepared givings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Donations (Partner/Project/Mission)</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Campaign</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2 text-gray-600">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-xs">{d.id}</td>
                    <td className="px-3 py-2 text-gray-600">{d.user_id || '—'}</td>
                    <td className="px-3 py-2">{d.donation_type}</td>
                    <td className="px-3 py-2">{d.amount}</td>
                    <td className="px-3 py-2 text-gray-600">{d.campaign_id || '—'}</td>
                    <td className="px-3 py-2">{d.status}</td>
                  </tr>
                ))}
                {!donations.length && (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>No prepared donations.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
