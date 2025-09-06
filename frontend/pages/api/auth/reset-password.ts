import { NextApiRequest, NextApiResponse } from 'next';
import { getCsrfToken } from 'next-auth/react';

interface ResetPasswordRequest extends NextApiRequest {
  body: {
    uid: string;
    token: string;
    new_password1: string;
    new_password2: string;
  };
}

export default async function handler(req: ResetPasswordRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid, token, new_password1, new_password2 } = req.body;

    // Basic validation
    if (!uid || !token || !new_password1 || !new_password2) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        errors: {
          ...(!uid && { uid: ['This field is required'] }),
          ...(!token && { token: ['This field is required'] }),
          ...(!new_password1 && { new_password1: ['This field is required'] }),
          ...(!new_password2 && { new_password2: ['This field is required'] }),
        },
      });
    }

    if (new_password1 !== new_password2) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        errors: {
          new_password2: ['The two password fields did not match.'],
        },
      });
    }

    // Get CSRF token for Django's CSRF protection
    const csrfToken = await getCsrfToken({ req });

    // Call Django's password reset confirm endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/password/reset/confirm/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          uid,
          token,
          new_password1,
          new_password2,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message:
          'Your password has been reset successfully. You can now log in with your new password.',
      });
    }

    // Handle validation errors from the server
    if (response.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the errors below',
        errors: data,
      });
    }

    // Handle token/uid validation errors
    if (response.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired password reset link',
        code: data.code || 'invalid_token',
      });
    }

    // Handle other errors
    return res.status(response.status).json({
      success: false,
      message: data.detail || 'Failed to reset password',
      errors: data,
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
}
