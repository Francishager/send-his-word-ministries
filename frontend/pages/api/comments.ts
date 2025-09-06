import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const Comment = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  date: z.string().optional(),
});

const CommentsBySlug = z.record(z.array(Comment));

function dataPath() {
  return path.join(process.cwd(), 'frontend', 'data', 'comments.json');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = dataPath();
  if (req.method === 'GET') {
    const slug = (req.query.slug as string) || '';
    if (!slug) return res.status(400).json({ ok: false, error: 'Missing slug' });
    try {
      const raw = await fs.readFile(file, 'utf8').catch(() => '{}');
      const store = JSON.parse(raw || '{}') as Record<string, any[]>;
      const list = Array.isArray(store[slug]) ? store[slug] : [];
      return res.status(200).json({ ok: true, comments: list });
    } catch (e) {
      return res.status(200).json({ ok: true, comments: [] });
    }
  }

  if (req.method === 'POST') {
    // In production you may want to require server-side session validation
    const parsed = Comment.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid comment' });
    try {
      const raw = await fs.readFile(file, 'utf8').catch(() => '{}');
      const store = JSON.parse(raw || '{}') as Record<string, any[]>;
      const slug = parsed.data.slug;
      store[slug] = Array.isArray(store[slug]) ? store[slug] : [];
      store[slug].push({ ...parsed.data, date: parsed.data.date || new Date().toISOString() });
      await fs.writeFile(file, JSON.stringify(store, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'Failed to write comment' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
