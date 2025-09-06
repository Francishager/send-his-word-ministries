import type { NextApiRequest, NextApiResponse } from 'next';

// Creates a Stripe Checkout Session via Stripe's REST API without the server SDK.
// Env required:
// - STRIPE_SECRET_KEY
// - NEXT_PUBLIC_SITE_URL (for success/cancel defaults)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(500).json({ ok: false, error: 'Missing STRIPE_SECRET_KEY' });

  try {
    const { amount, currency = 'usd', mode = 'payment', success_url, cancel_url, metadata = {} } = req.body || {};
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ ok: false, error: 'Invalid amount' });
    const site = process.env.NEXT_PUBLIC_SITE_URL || (req.headers['origin'] as string) || 'http://localhost:3000';

    const body = new URLSearchParams();
    body.append('mode', mode);
    body.append('success_url', success_url || `${site}/payments/success`);
    body.append('cancel_url', cancel_url || `${site}/payments/cancel`);
    body.append('line_items[0][price_data][currency]', currency);
    body.append('line_items[0][price_data][product_data][name]', 'Donation');
    body.append('line_items[0][price_data][unit_amount]', String(Math.round(Number(amount) * 100)));
    body.append('line_items[0][quantity]', '1');
    Object.entries(metadata || {}).forEach(([k, v]) => body.append(`metadata[${k}]`, String(v)));

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(400).json({ ok: false, error: data?.error?.message || 'Failed to create session' });

    return res.status(200).json({ ok: true, url: data.url, id: data.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Server error' });
  }
}
