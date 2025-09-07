import React from 'react';
import { useDonate, DonateOpenOptions } from '@/components/donate/DonateModalContext';

export default function DonateButton({
  children = 'Donate',
  options,
  className = 'rounded-md bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-500',
  type = 'button',
}: {
  children?: React.ReactNode;
  options?: DonateOpenOptions;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const donate = useDonate();
  return (
    <button
      type={type}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        donate.open(options);
      }}
    >
      {children}
    </button>
  );
}
