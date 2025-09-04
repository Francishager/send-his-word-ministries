// pages/api/auth/register.ts
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
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password', 'firstName', 'lastName']
      });
    }

    // Get CSRF token for Django's CSRF protection
    const csrfToken = await getCsrfToken({ req });

    // Call Django registration endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle Django validation errors
      if (response.status === 400) {
        return res.status(400).json({
          message: 'Validation error',
          errors: data,
        });
      }
      throw new Error(data.detail || 'Registration failed');
    }

    // Auto-login after successful registration
    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      // Registration succeeded but auto-login failed
      return res.status(200).json({ 
        success: true, 
        message: 'Registration successful. Please log in.',
        redirectTo: '/auth/login',
      });
    }

    const userData = await loginResponse.json();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userData.user,
      tokens: {
        access: userData.access,
        refresh: userData.refresh,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during registration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}