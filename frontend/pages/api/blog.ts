import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const BlogPost = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  contentHtml: z.string().min(1),
  videoUrl: z.string().url().optional(),
  coverImage: z.string().optional(),
  categoryId: z.string().min(1),
  author: z.string().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isNews: z.boolean().optional().default(false),
  status: z.enum(['published','pending']).optional().default('published'),
});
const BlogSchema = z.array(BlogPost);

function dataPath() {
  return path.join(process.cwd(), 'frontend', 'data', 'blog.json');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const file = dataPath();
  if (req.method === 'GET') {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data = JSON.parse(raw || '[]');
      const parsed = BlogSchema.safeParse(data);
      if (!parsed.success) return res.status(500).json({ ok: false, error: 'Invalid blog data' });
      const items = parsed.data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return res.status(200).json({ ok: true, posts: items });
    } catch (e: any) {
      return res.status(200).json({ ok: true, posts: [] });
    }
  }

  if (req.method === 'PUT') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Editing disabled in production' });
    }
    const body = req.body?.posts ?? req.body;
    const parsed = BlogSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid payload' });
    try {
      await fs.writeFile(file, JSON.stringify(parsed.data, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false, error: 'Failed to write' });
    }
  }

  if (req.method === 'POST') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Editing disabled in production' });
    }
    // Create/Update a single post by slug
    const parsed = BlogPost.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid post' });
    try {
      const raw = await fs.readFile(file, 'utf8').catch(() => '[]');
      const list = (JSON.parse(raw || '[]') as any[]);
      const idx = list.findIndex((p) => p.slug === parsed.data.slug);
      if (idx >= 0) list[idx] = parsed.data; else list.push(parsed.data);
      await fs.writeFile(file, JSON.stringify(list, null, 2), 'utf8');
      return res.status(200).json({ ok: true, post: parsed.data });
    } catch {
      return res.status(500).json({ ok: false, error: 'Failed to write post' });
    }
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
