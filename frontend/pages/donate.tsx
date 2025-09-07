import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import FadeUp from '@/components/ux/FadeUp';
import { useToast } from '@/components/ui/use-toast';
import { useDonate } from '@/components/donate/DonateModalContext';

export default function DonatePage() {
  const { success, error } = useToast();
  const donate = useDonate();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    amount: '',
    message: '',
    frequency: 'ONE_TIME',
    currency: 'usd',
  });
  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const pesapalEnabled = process.env.NEXT_PUBLIC_PESAPAL_ENABLED === 'true';
  const mpesaEnabled = process.env.NEXT_PUBLIC_MPESA_ENABLED === 'true';

  // Currency handling: convert amount and update placeholder symbol when currency changes
  const FX: Record<string, number> = {
    usd: 1,
    eur: 0.92,
    gbp: 0.78,
    ugx: 3800,
    kes: 128,
    tzs: 2600,
  };
  const SYMBOL: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    ugx: 'USh ',
    kes: 'KSh ',
    tzs: 'TSh ',
  };
  const placeholderFor = (currency: string) => `${SYMBOL[currency] || ''}100`;

  const prevCurrencyRef = React.useRef(form.currency);
  React.useEffect(() => {
    const prev = prevCurrencyRef.current;
    const next = form.currency;
    if (prev !== next && form.amount) {
      const amt = Number(form.amount);
      if (!isNaN(amt)) {
        const usdValue = amt / (FX[prev] || 1);
        const converted = usdValue * (FX[next] || 1);
        setForm((p) => ({ ...p, amount: String(Math.round(converted * 100) / 100) }));
      }
    }
    prevCurrencyRef.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.currency]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Donation (${form.frequency}) - ${form.amount}`,
          message: form.message || `I would like to donate ${form.amount} (${form.frequency.toLowerCase().replace('_',' ')}).`,
          consent: true,
          phone: undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to submit');
      success('Thank you so much for your generosity! We will follow up with next steps.');
      setForm({ name: '', email: '', amount: '', message: '', frequency: 'ONE_TIME', currency: form.currency });
    } catch (e: any) {
      error(e?.message || 'Could not submit. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const payWithPesapal = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      const res = await fetch('/api/payments/pesapal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: form.currency, description: form.frequency, reference: `donate-${Date.now()}` }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start Pesapal');
      if (j.redirectUrl) window.open(j.redirectUrl, '_blank');
    } catch (e: any) {
      error(e?.message || 'Could not start Pesapal');
    }
  };

  const payWithMpesa = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      const phone = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX)');
      if (!phone) return;
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: 'KES', phone, reference: form.frequency }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start M-Pesa');
      alert('M-Pesa prompt initiated. Please complete on your phone.');
    } catch (e: any) {
      error(e?.message || 'Could not start M-Pesa');
    }
  };

  const payWithStripe = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      const res = await fetch('/api/payments/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: form.currency, mode: 'payment', metadata: { frequency: form.frequency } }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start payment');
      window.location.href = j.url;
    } catch (e: any) {
      error(e?.message || 'Could not start Stripe checkout');
    }
  };

  return (
    <MainLayout title="Donate | Send His Word" description="Support Send His Word Ministries through a donation.">
      <section className="relative">
        <div className="relative">
          <img src="/images/hero/home_hero_3.JPG" alt="Donate" className="w-full h-[280px] object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="max-w-6xl mx-auto px-4 w-full text-white pb-6 md:pb-0">
              <FadeUp>
                <h1 className="text-3xl md:text-5xl font-extrabold">Donate</h1>
                <p className="text-gray-200 mt-2 max-w-2xl">Every gift makes an impact. Thank you for advancing the Gospel with us.</p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-4 text-center underline decoration-indigo-600 underline-offset-8 decoration-2">Donation Options</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">One-Time Gifts</h3>
              <p className="text-sm text-gray-700 mt-1">Give a one-time gift toward our ongoing ministry needs.</p>
              <div className="mt-3">
                <button
                  onClick={() => donate.open({ amount: form.amount, currency: form.currency, frequency: 'ONE_TIME', mode: 'donate' })}
                  className="rounded-md bg-purple-600 px-4 py-2 text-white text-sm font-medium hover:bg-purple-500"
                >
                  Donate Now
                </button>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">Monthly Partners</h3>
              <p className="text-sm text-gray-700 mt-1">Become a monthly partner to sustain long-term projects and outreach.</p>
              <div className="mt-3">
                <button
                  onClick={() => donate.open({ amount: form.amount, currency: form.currency, frequency: 'MONTHLY', mode: 'donate' })}
                  className="rounded-md bg-purple-600 px-4 py-2 text-white text-sm font-medium hover:bg-purple-500"
                >
                  Donate Now
                </button>
              </div>
            </div>
          </div>
        </div>
        <aside>
          <div className="rounded-xl border bg-white p-4 sticky top-20">
            <h3 className="font-semibold mb-2">Pledge / Get Details</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input value={form.name} onChange={(e) => on('name', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => on('email', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ({form.currency.toUpperCase()})</label>
                  <input value={form.amount} onChange={(e) => on('amount', e.target.value)} placeholder={placeholderFor(form.currency)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => on('frequency', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                    <option value="ONE_TIME">One-time</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => on('currency', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                    <option value="ugx">UGX</option>
                    <option value="kes">KES</option>
                    <option value="tzs">TZS</option>
                  </select>
                </div>
                <div className="hidden md:block" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message (optional)</label>
                <textarea value={form.message} onChange={(e) => on('message', e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button disabled={loading} className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">{loading ? 'Submitting…' : 'Send'}</button>
            </form>
          </div>
        </aside>
      </section>
    </MainLayout>
  );
}
