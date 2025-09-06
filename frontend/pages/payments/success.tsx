import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <MainLayout title="Payment Successful | Send His Word" description="Thank you for your generosity.">
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border bg-white p-8">
          <h1 className="text-3xl font-extrabold text-green-700">Thank you!</h1>
          <p className="mt-3 text-gray-700">Your payment was successful. We truly appreciate your partnership with Send His Word Ministries.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/give" className="rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500">Back to Give</Link>
            <Link href="/" className="rounded-md border px-4 py-2 text-sm">Home</Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
