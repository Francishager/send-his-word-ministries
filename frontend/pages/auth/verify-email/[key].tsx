import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Head from 'next/head';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'invalid';

export default function VerifyEmail() {
  const router = useRouter();
  const { key } = router.query;
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) return;

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          toast.success('Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email. The link may be invalid or expired.');
          toast.error(data.message || 'Failed to verify email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
        toast.error('An error occurred while verifying your email');
      }
    };

    if (key) {
      verifyEmail();
    } else {
      setStatus('invalid');
      setMessage('Invalid verification link');
    }
  }, [key]);

  const renderStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-12 w-12 text-green-500" aria-hidden="true" />;
      case 'error':
      case 'invalid':
        return <XCircleIcon className="h-12 w-12 text-red-500" aria-hidden="true" />;
      default:
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email | Send His Word Ministries</title>
        <meta name="description" content="Verify your email address" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            {renderStatusIcon()}
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {status === 'success' ? 'Email Verified!' : 'Verifying Email...'}
            </h2>
            <p className="mt-2 text-center text-lg text-gray-600">{message}</p>
          </div>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              {status === 'success' && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Your email has been verified successfully! You can now log in to your
                        account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(status === 'error' || status === 'invalid') && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {status === 'invalid'
                          ? 'Invalid verification link'
                          : 'Could not verify your email'}
                      </h3>
                      <p className="mt-2 text-sm text-red-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>

              {(status === 'error' || status === 'invalid') && (
                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Need a new verification email?{' '}
                    <Link
                      href="/auth/request-verification"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Request a new one
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
