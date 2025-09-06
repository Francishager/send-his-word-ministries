import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Requires env vars:
// CLOUDINARY_CLOUD_NAME
// CLOUDINARY_API_KEY
// CLOUDINARY_API_SECRET

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const { folder = 'shwm', public_id } = req.body || {};
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ ok: false, error: 'Cloudinary env not configured' });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  if (public_id) paramsToSign.public_id = public_id;
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join('&');
  const signature = crypto
    .createHash('sha1')
    .update(sorted + apiSecret)
    .digest('hex');
  return res.status(200).json({ ok: true, cloudName, apiKey, timestamp, folder, signature });
}
