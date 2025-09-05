import * as React from 'react';
import clsx from 'clsx';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={clsx(
        'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:outline-none',
        className
      )}
      {...props}
    />
  );
});
Checkbox.displayName = 'Checkbox';

export default Checkbox;
