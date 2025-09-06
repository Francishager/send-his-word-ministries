import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(3),
  message: z.string().min(10),
  consent: z.boolean().refine((v) => v === true, 'consent required'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const { name, email, phone, subject, message } = parsed.data;

  // Validate SMTP configuration
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

    const html = `
      <div style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.6">
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space:pre-wrap;border-left:3px solid #e5e7eb;padding:8px 12px;background:#fafafa">${message}</div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: `[Contact] ${subject}`,
      text: `From: ${name} <${email}>${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`,
      html,
      replyTo: email,
    });

    return res.status(200).json({ ok: true, message: 'Message sent successfully' });
  } catch (err: any) {
    console.error('contact mail error', err);
    return res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
}
