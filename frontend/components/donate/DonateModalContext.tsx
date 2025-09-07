import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export type DonateOpenOptions = {
  amount?: number | string;
  currency?: string; // e.g., 'usd'
  type?: string; // e.g., 'TITHE' | 'OFFERING' | 'MISSIONS'
  frequency?: 'ONE_TIME' | 'MONTHLY';
};

export type DonateContextValue = {
  open: (opts?: DonateOpenOptions) => void;
  close: () => void;
};

const DonateContext = React.createContext<DonateContextValue | undefined>(undefined);

export function useDonate(): DonateContextValue {
  const ctx = React.useContext(DonateContext);
  if (!ctx) throw new Error('useDonate must be used within DonateProvider');
  return ctx;
}

export function DonateProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const pesapalEnabled = process.env.NEXT_PUBLIC_PESAPAL_ENABLED === 'true';
  const mpesaEnabled = process.env.NEXT_PUBLIC_MPESA_ENABLED === 'true';

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    amount: '',
    message: '',
    type: 'TITHE',
    frequency: 'ONE_TIME' as 'ONE_TIME' | 'MONTHLY',
    currency: 'usd',
  });
  const on = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const [method, setMethod] = React.useState<'card' | 'mobile'>('card');

  const FX: Record<string, number> = { usd: 1, eur: 0.92, gbp: 0.78, ugx: 3800, kes: 128, tzs: 2600 };
  const SYMBOL: Record<string, string> = { usd: '$', eur: '€', gbp: '£', ugx: 'USh ', kes: 'KSh ', tzs: 'TSh ' };
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
  }, [form.currency]);

  const startStripe = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      setLoading(true);
      const res = await fetch('/api/payments/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: form.currency, mode: 'payment', metadata: { type: form.type, frequency: form.frequency } }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start payment');
      window.location.href = j.url;
    } catch (e: any) {
      error(e?.message || 'Could not start Stripe checkout');
    } finally {
      setLoading(false);
    }
  };

  const startPesapal = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      setLoading(true);
      const res = await fetch('/api/payments/pesapal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: form.currency, description: form.type, reference: `give-${Date.now()}` }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start Pesapal');
      if (j.redirectUrl) window.open(j.redirectUrl, '_blank');
    } catch (e: any) {
      error(e?.message || 'Could not start Pesapal');
    } finally {
      setLoading(false);
    }
  };

  const startMpesa = async () => {
    try {
      if (!form.amount) return alert('Please enter an amount');
      const phone = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX)');
      if (!phone) return;
      setLoading(true);
      const res = await fetch('/api/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(form.amount), currency: 'KES', phone, reference: form.type }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to start M-Pesa');
      alert('M-Pesa prompt initiated. Please complete on your phone.');
    } catch (e: any) {
      error(e?.message || 'Could not start M-Pesa');
    } finally {
      setLoading(false);
    }
  };

  const value: DonateContextValue = {
    open: (opts) => {
      setForm((p) => ({
        ...p,
        amount: opts?.amount != null ? String(opts.amount) : p.amount,
        currency: opts?.currency || p.currency,
        type: opts?.type || p.type,
        frequency: (opts?.frequency as any) || p.frequency,
      }));
      const cur = (opts?.currency || form.currency || 'usd').toLowerCase();
      const mobileCurrencies = new Set(['kes', 'ugx', 'tzs']);
      setMethod(mobileCurrencies.has(cur) ? 'mobile' : 'card');
      setOpen(true);
    },
    close: () => setOpen(false),
  };

  return (
    <DonateContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Give / Donate</h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">✕</button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="block mb-2">Select a payment method</Label>
                  <div className="flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="paymethod" value="card" checked={method === 'card'} onChange={() => setMethod('card')} />
                      Card (Stripe)
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="paymethod" value="mobile" checked={method === 'mobile'} onChange={() => setMethod('mobile')} />
                      Mobile Money
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block mb-1">Name</Label>
                    <Input value={form.name} onChange={(e) => on('name', e.target.value)} />
                  </div>
                  <div>
                    <Label className="block mb-1">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => on('email', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block mb-1">Amount ({form.currency.toUpperCase()})</Label>
                    <Input value={form.amount} onChange={(e) => on('amount', e.target.value)} placeholder={placeholderFor(form.currency)} />
                  </div>
                  <div>
                    <Label className="block mb-1">Currency</Label>
                    <select value={form.currency} onChange={(e) => on('currency', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="gbp">GBP</option>
                      <option value="ugx">UGX</option>
                      <option value="kes">KES</option>
                      <option value="tzs">TZS</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block mb-1">Type</Label>
                    <select value={form.type} onChange={(e) => on('type', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                      <option value="TITHE">Tithe</option>
                      <option value="OFFERING">Offering</option>
                      <option value="MISSIONS">Missions</option>
                    </select>
                  </div>
                  <div>
                    <Label className="block mb-1">Frequency</Label>
                    <select value={form.frequency} onChange={(e) => on('frequency', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm">
                      <option value="ONE_TIME">One-time</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="block mb-1">Message (optional)</Label>
                  <textarea value={form.message} onChange={(e) => on('message', e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={async () => {
                      if (method === 'card') {
                        await startStripe();
                        return;
                      }
                      // mobile money: prefer M-Pesa if enabled, else fall back to Pesapal
                      if (mpesaEnabled) {
                        await startMpesa();
                        return;
                      }
                      if (pesapalEnabled) {
                        await startPesapal();
                        return;
                      }
                      error('Mobile money is not enabled. Please choose Card instead.');
                    }}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500"
                  >
                    {loading ? 'Processing…' : method === 'card' ? 'Continue with Card' : 'Continue with Mobile Money'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DonateContext.Provider>
  );
}
