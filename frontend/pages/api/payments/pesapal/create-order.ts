import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder scaffold: Initiate Pesapal order (provider-side completion).
// Configure env:
// - PESAPAL_CONSUMER_KEY
// - PESAPAL_CONSUMER_SECRET
// - NEXT_PUBLIC_SITE_URL (for callback)
// - PESAPAL_CALLBACK_URL (optional override)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) return res.status(500).json({ ok: false, error: 'Missing Pesapal credentials' });

  const { amount, currency = 'KES', description = 'Donation', reference } = req.body || {};
  if (!amount || isNaN(Number(amount))) return res.status(400).json({ ok: false, error: 'Invalid amount' });

  // In a real integration, request an access token then create an order and get redirect URL.
  // For now, return a placeholder URL and echo the payload so caller can redirect.
  const site = process.env.NEXT_PUBLIC_SITE_URL || (req.headers['origin'] as string) || 'http://localhost:3000';
  const callback = process.env.PESAPAL_CALLBACK_URL || `${site}/api/payments/pesapal/callback`;

  return res.status(200).json({ ok: true, redirectUrl: 'https://www.pesapal.com/', callback, payload: { amount, currency, description, reference } });
}
