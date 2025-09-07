import React from 'react';
import { useDonate, DonateOpenOptions } from '@/components/donate/DonateModalContext';

export default function DonateButton({
  children = 'Donate',
  options,
  className,
  type = 'button',
  variant = 'solid',
}: {
  children?: React.ReactNode;
  options?: DonateOpenOptions;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'solid' | 'link';
}) {
  const donate = useDonate();
  const base =
    variant === 'link'
      ? 'inline-flex items-center text-indigo-600 hover:text-indigo-700 underline underline-offset-4'
      : 'rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500';
  return (
    <button
      type={type}
      className={className || base}
      onClick={(e) => {
        e.preventDefault();
        donate.open(options);
      }}
    >
      {children}
    </button>
  );
}
