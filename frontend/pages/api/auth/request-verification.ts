import { NextApiRequest, NextApiResponse } from 'next';
import { getCsrfToken } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        field: 'email',
      });
    }

    // Get CSRF token for Django's CSRF protection
    const csrfToken = await getCsrfToken({ req });

    // Call Django's resend verification email endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/registration/resend-email/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ email }),
      }
    );

    // Always return success to prevent email enumeration attacks
    return res.status(200).json({
      success: true,
      message:
        'If your email is registered and not already verified, you will receive a new verification email shortly.',
    });
  } catch (error) {
    console.error('Request verification email error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
}
