import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // we need raw body for Stripe signature verification
  },
};

async function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature({ payload, header, secret }: { payload: string; header: string | string[] | undefined; secret: string; }) {
  if (!header || Array.isArray(header)) return false;
  // header format: t=timestamp,v1=signature,...
  const parts = header.split(',').reduce<Record<string, string>>((acc, kv) => {
    const [k, v] = kv.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const signedPayload = `${t}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  // Support multiple signatures if present (comma separated in header v1 list)
  const signatures = v1.split(' ');
  return signatures.includes(expected);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ ok: false, error: 'Missing STRIPE_WEBHOOK_SECRET' });

  try {
    const payload = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    const valid = verifyStripeSignature({ payload, header: sig, secret });
    if (!valid) return res.status(400).json({ ok: false, error: 'Invalid signature' });

    const event = JSON.parse(payload);

    switch (event.type) {
      case 'checkout.session.completed': {
        // You can persist donation/metadata here
        // const session = event.data.object;
        // TODO: save to DB or send notification
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message || 'Webhook error' });
  }
}
