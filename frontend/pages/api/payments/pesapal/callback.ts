import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder scaffold: Pesapal will redirect/callback here after payment.
// We only acknowledge and optionally log the payload. No fund handling occurs here.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const payload = method === 'GET' ? req.query : req.body;
    // TODO: Verify payload with Pesapal APIs if needed and persist status
    return res.status(200).json({ ok: true, received: payload });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message || 'Callback error' });
  }
}
