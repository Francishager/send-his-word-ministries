import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const schema = z.object({ email: z.string().email() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email' });

  const { email } = parsed.data;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = /^true$/i.test(process.env.SMTP_SECURE || 'false');
  const from = process.env.SMTP_FROM || user || 'no-reply@localhost';
  const to = process.env.CONTACT_TO || user || from;

  if (!host || !user || !pass) {
    return res
      .status(500)
      .json({ ok: false, error: 'Mail service is not configured on the server.' });
  }

  try {
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const subject = `[Newsletter] New subscription`;
    const text = `Please add this email to your newsletter list: ${email}`;
    const html = `<p>New newsletter subscription:</p><p><strong>${email}</strong></p>`;

    await transporter.sendMail({ from, to, subject, text, html, replyTo: email });

    return res.status(200).json({ ok: true, message: 'Subscribed' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Failed to subscribe' });
  }
}
