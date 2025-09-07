import React from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

export default function ToastMessage({
  id,
  message,
  variant = 'default',
  onClose,
}: {
  id?: string;
  message: string;
  variant?: ToastVariant;
  onClose: (id?: string) => void;
}) {
  const color =
    variant === 'destructive'
      ? 'border-red-200 text-red-800'
      : variant === 'success'
      ? 'border-emerald-200 text-emerald-800'
      : variant === 'info'
      ? 'border-blue-200 text-blue-800'
      : variant === 'warning'
      ? 'border-amber-200 text-amber-800'
      : 'border-gray-200 text-gray-800';

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-md border bg-white px-4 py-3 shadow-lg ${color}`}>
      <div className="mt-0.5">
        {variant === 'destructive' ? '⚠️' : variant === 'success' ? '✅' : variant === 'info' ? 'ℹ️' : variant === 'warning' ? '⚠️' : '💬'}
      </div>
      <div className="text-sm leading-5">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="ml-auto -mr-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 text-gray-500"
        aria-label="Close"
        title="Close"
      >
        ×
      </button>
    </div>
  );
}
