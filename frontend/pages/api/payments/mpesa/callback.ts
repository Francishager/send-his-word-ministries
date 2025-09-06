import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder scaffold: M-Pesa will POST callbacks here after payment.
// We only acknowledge and optionally log. No funds handled on our servers.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const payload = req.body;
    // TODO: Verify payload with M-Pesa APIs if needed and persist status
    return res.status(200).json({ ok: true, received: payload });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message || 'Callback error' });
  }
}
