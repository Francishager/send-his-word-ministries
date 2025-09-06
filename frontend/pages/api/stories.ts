import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const Story = z.object({
  src: z.string().min(1),
  name: z.string().min(1),
  quote: z.string().min(1),
  focus: z.string().optional(), // CSS object-position like '50% 30%'
});

const StoriesSchema = z.array(Story);

function dataPath() {
  return path.join(process.cwd(), 'frontend', 'data', 'stories.json');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = dataPath();

  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw);
      const parsed = StoriesSchema.safeParse(data);
      if (!parsed.success) return res.status(500).json({ ok: false, error: 'Invalid stories data' });
      return res.status(200).json({ ok: true, stories: parsed.data });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: 'Failed to read stories' });
    }
  }

  if (req.method === 'PUT') {
    // Local-only editing: block in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Editing disabled in production' });
    }
    const parsed = StoriesSchema.safeParse(req.body?.stories ?? req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid payload' });
    try {
      const json = JSON.stringify(parsed.data, null, 2);
      await fs.writeFile(file, json, 'utf8');
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: 'Failed to write stories' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
