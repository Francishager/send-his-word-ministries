import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <MainLayout title="Payment Canceled | Send His Word" description="You can try again anytime.">
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border bg-white p-8">
          <h1 className="text-3xl font-extrabold text-amber-700">Payment Canceled</h1>
          <p className="mt-3 text-gray-700">Your payment was canceled or didn’t complete. If this was a mistake, you can try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/give" className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">Try Again</Link>
            <Link href="/" className="rounded-md border px-4 py-2 text-sm">Home</Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
