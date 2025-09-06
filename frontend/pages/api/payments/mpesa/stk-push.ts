import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder scaffold: Initiate M-Pesa STK push or redirect (provider-side completion).
// Configure env:
// - MPESA_CONSUMER_KEY
// - MPESA_CONSUMER_SECRET
// - MPESA_SHORTCODE
// - MPESA_PASSKEY
// - MPESA_CALLBACK_URL (optional override)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) return res.status(500).json({ ok: false, error: 'Missing M-Pesa credentials' });

  const { amount, currency = 'KES', phone, reference = 'Donation' } = req.body || {};
  if (!amount || isNaN(Number(amount))) return res.status(400).json({ ok: false, error: 'Invalid amount' });

  // In a real integration, obtain OAuth token and call STK push endpoint.
  // For now, return placeholder data.
  const callback = process.env.MPESA_CALLBACK_URL || '/api/payments/mpesa/callback';
  return res.status(200).json({ ok: true, initiated: true, callback, payload: { amount, currency, phone, reference } });
}
