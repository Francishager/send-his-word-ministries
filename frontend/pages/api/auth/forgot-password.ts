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
        message: 'Email is required',
        field: 'email',
      });
    }

    // Get CSRF token for Django's CSRF protection
    const csrfToken = await getCsrfToken({ req });

    // Call Django's password reset endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password/reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify({ email }),
    });

    // Even if the email doesn't exist, we don't want to reveal that to the user
    // for security reasons, so we always return a success message
    if (response.status === 200 || response.status === 204) {
      return res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, you will receive a password reset link shortly.',
      });
    }

    // If we get here, there was an error with the request
    const errorData = await response.json().catch(() => ({}));

    return res.status(response.status).json({
      success: false,
      message: errorData.detail || 'Failed to process password reset request',
      errors: errorData,
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
}
