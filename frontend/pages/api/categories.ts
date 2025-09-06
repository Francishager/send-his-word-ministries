import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const Category = z.object({ id: z.string().min(1), name: z.string().min(1) });
const Categories = z.array(Category);

function dataPath() {
  return path.join(process.cwd(), 'frontend', 'data', 'categories.json');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = dataPath();
  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw || '[]');
      const parsed = Categories.safeParse(data);
      if (!parsed.success)
        return res.status(500).json({ ok: false, error: 'Invalid categories data' });
      return res.status(200).json({ ok: true, categories: parsed.data });
    } catch (e) {
      return res.status(200).json({ ok: true, categories: [] });
    }
  }
  if (req.method === 'PUT') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Editing disabled in production' });
    }
    const parsed = Categories.safeParse(req.body?.categories ?? req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid payload' });
    try {
      await fs.writeFile(file, JSON.stringify(parsed.data, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'Failed to write categories' });
    }
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
