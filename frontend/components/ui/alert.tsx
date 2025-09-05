import * as React from 'react';
import clsx from 'clsx';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  default: 'bg-white text-gray-900 border-gray-200',
  destructive: 'bg-red-50 text-red-800 border-red-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={clsx('w-full rounded-md border p-4', variantClasses[variant], className)}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={clsx('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={clsx('text-sm opacity-90', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export default Alert;
