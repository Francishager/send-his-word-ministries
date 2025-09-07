import React from 'react';
import { toast as hotToast, ToastOptions } from 'react-hot-toast';
import ToastMessage from '@/components/ui/ToastMessage';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

export interface UseToastReturn {
  toast: (message: string, opts?: ToastOptions) => void;
  success: (message: string, opts?: ToastOptions) => void;
  error: (message: string, opts?: ToastOptions) => void;
  info: (message: string, opts?: ToastOptions) => void;
  dismiss: (id?: string) => void;
}

export function useToast(): UseToastReturn {
  const makeId = (variant: ToastVariant, message: string, id?: string) =>
    id || `${variant}:${message}`.slice(0, 120);

  const show = (fn: (msg: string, opts?: ToastOptions) => any, variant: ToastVariant, message: string, opts?: ToastOptions) => {
    const id = makeId(variant, message, opts?.id as string | undefined);
    // Replace any existing identical toast to avoid stacking
    hotToast.dismiss(id);
    // For default/hot toasts, rely on built-in rendering
    fn(message, { id, duration: opts?.duration ?? 6000, position: (opts?.position as any) ?? 'top-right', ...opts });
  };

  const showCustom = (variant: ToastVariant, message: string, opts?: ToastOptions) => {
    const id = makeId(variant, message, opts?.id as string | undefined);
    hotToast.dismiss(id);
    hotToast.custom(
      React.createElement(ToastMessage, {
        id,
        message,
        variant,
        onClose: (closeId?: string) => hotToast.dismiss(closeId || id),
      }),
      { id, duration: opts?.duration ?? 6000, position: (opts?.position as any) ?? 'top-right' }
    );
  };

  return {
    toast: (message, opts) => show(hotToast, 'default', message, opts),
    success: (message, opts) => showCustom('success', message, opts),
    error: (message, opts) => showCustom('destructive', message, opts),
    info: (message, opts) => showCustom('info', message, opts),
    dismiss: (id?: string) => hotToast.dismiss(id),
  };
}

export default useToast;
