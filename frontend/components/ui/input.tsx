import * as React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const base = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={clsx(base, className)} {...props} />;
  }
);
Input.displayName = 'Input';

export default Input;
