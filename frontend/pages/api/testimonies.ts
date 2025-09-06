import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'frontend', 'data', 'testimonies.json');

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeAll(items: any[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic IP-based rate limit (per minute)
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  ;(global as any).__TESTI_RATE__ = (global as any).__TESTI_RATE__ || new Map<string, number[]>();
  const store: Map<string, number[]> = (global as any).__TESTI_RATE__;
  const windowMs = 60 * 1000; // 1 minute
  const limit = 10; // 10 req/min per IP
  const arr = store.get(ip)?.filter((t) => now - t < windowMs) || [];
  arr.push(now);
  store.set(ip, arr);
  if (arr.length > limit) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  if (req.method === 'GET') {
    const items = readAll();
    return res.status(200).json({ ok: true, testimonies: items });
  }
  if (req.method === 'POST') {
    try {
      const items = readAll();
      const body = req.body || {};
      const nowIso = new Date().toISOString();
      // Honeypot (if a hidden field is filled, reject)
      if (typeof body.website === 'string' && body.website.trim().length > 0) {
        return res.status(400).json({ ok: false, error: 'Invalid submission' });
      }
      // Validation
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (title.length < 3) return res.status(400).json({ ok: false, error: 'Title too short' });
      if (content.length < 10) return res.status(400).json({ ok: false, error: 'Story is too short' });

      const item = {
        id: body.id || `t-${Date.now()}`,
        name: (body.name || 'Anonymous').toString().slice(0, 120),
        title,
        content,
        imageUrl: (body.imageUrl || '').toString().slice(0, 2000),
        videoUrl: (body.videoUrl || '').toString().slice(0, 2000),
        date: body.date || nowIso,
        approved: false,
      };
      items.unshift(item);
      writeAll(items);
      return res.status(201).json({ ok: true, item });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'Failed to save testimony' });
    }
  }
  if (req.method === 'PUT') {
    // Bulk update (e.g., approve/reorder) for admin usage
    try {
      const items = Array.isArray(req.body) ? req.body : [];
      writeAll(items);
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'Failed to update testimonies' });
    }
  }
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
