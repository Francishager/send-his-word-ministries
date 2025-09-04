import { NextApiRequest, NextApiResponse } from 'next';
import { getCsrfToken } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { key } = req.body; // The verification key from the URL

    if (!key) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification key is required',
      });
    }

    // Get CSRF token for Django's CSRF protection
    const csrfToken = await getCsrfToken({ req });

    // Call Django's email verification endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/registration/verify-email/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ key }),
      }
    );

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in to your account.',
      });
    }

    // Handle different error statuses
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 400) {
      return res.status(400).json({
        success: false,
        message: errorData.detail || 'Invalid or expired verification link',
        code: errorData.code || 'invalid_key',
      });
    }

    // Handle other errors
    return res.status(response.status).json({
      success: false,
      message: errorData.detail || 'Failed to verify email',
      errors: errorData,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying your email',
    });
  }
}
