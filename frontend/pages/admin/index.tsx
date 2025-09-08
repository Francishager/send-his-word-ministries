import React from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function AdminHome() {
  const [giving, setGiving] = React.useState<any[]>([]);
  const [donations, setDonations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/core/reports/giving/by-type`, { credentials: 'include' }),
        fetch(`${API_BASE}/core/reports/donations/by-type`, { credentials: 'include' }),
      ]);
      if (!gRes.ok) throw new Error(`Failed to load giving (${gRes.status})`);
      if (!dRes.ok) throw new Error(`Failed to load donations (${dRes.status})`);
      setGiving(await gRes.json());
      setDonations(await dRes.json());
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0);
  const givingTotal = sum(giving, 'total_amount');
  const givingCount = sum(giving, 'tx_count');
  const donationsTotal = sum(donations, 'total_amount');
  const donationsCount = sum(donations, 'tx_count');

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <AdminLayout title="Dashboard">
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {loading && <div className="mb-4 text-gray-500">Loading…</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Giving Total</div>
            <div className="text-2xl font-semibold">${'{'}givingTotal.toLocaleString(){'}'}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Giving Transactions</div>
            <div className="text-2xl font-semibold">${'{'}givingCount.toLocaleString(){'}'}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Donations Total</div>
            <div className="text-2xl font-semibold">${'{'}donationsTotal.toLocaleString(){'}'}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Donations Transactions</div>
            <div className="text-2xl font-semibold">${'{'}donationsCount.toLocaleString(){'}'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Giving by Type</h2>
              <button onClick={fetchData} className="rounded bg-gray-900 text-white text-xs px-2 py-1">Refresh</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Type</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Tx</th>
                  <th className="py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {giving.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 capitalize">{r.giving_type}</td>
                    <td className="py-1 capitalize">{r.status}</td>
                    <td className="py-1">{Number(r.tx_count).toLocaleString()}</td>
                    <td className="py-1">{Number(r.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
                {!giving.length && (
                  <tr><td className="py-2 text-gray-500" colSpan={4}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Donations by Type</h2>
              <button onClick={fetchData} className="rounded bg-gray-900 text-white text-xs px-2 py-1">Refresh</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Type</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Tx</th>
                  <th className="py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 capitalize">{r.donation_type}</td>
                    <td className="py-1 capitalize">{r.status}</td>
                    <td className="py-1">{Number(r.tx_count).toLocaleString()}</td>
                    <td className="py-1">{Number(r.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
                {!donations.length && (
                  <tr><td className="py-2 text-gray-500" colSpan={4}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </AdminLayout>
    </>
  );
}

export default withAuth(AdminHome);
