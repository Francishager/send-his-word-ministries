import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const MomentSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  image: z.string().optional(),
  videoUrl: z.string().url().optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
});

function dataPath() {
  return path.join(process.cwd(), 'frontend', 'data', 'moment.json');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = dataPath();
  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw);
      const parsed = MomentSchema.safeParse(data);
      if (!parsed.success) return res.status(500).json({ ok: false, error: 'Invalid moment data' });
      return res.status(200).json({ ok: true, moment: parsed.data });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: 'Failed to read moment' });
    }
  }
  if (req.method === 'PUT') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Editing disabled in production' });
    }
    const parsed = MomentSchema.safeParse(req.body?.moment ?? req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid payload' });
    try {
      await fs.writeFile(file, JSON.stringify(parsed.data, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: 'Failed to write moment' });
    }
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
