import { toast as hotToast, ToastOptions } from 'react-hot-toast';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

export interface UseToastReturn {
  toast: (message: string, opts?: ToastOptions) => void;
  success: (message: string, opts?: ToastOptions) => void;
  error: (message: string, opts?: ToastOptions) => void;
  info: (message: string, opts?: ToastOptions) => void;
  dismiss: (id?: string) => void;
}

export function useToast(): UseToastReturn {
  return {
    toast: (message, opts) => hotToast(message, opts),
    success: (message, opts) => hotToast.success(message, opts),
    error: (message, opts) => hotToast.error(message, opts),
    info: (message, opts) => hotToast(message, { icon: 'ℹ️', ...opts }),
    dismiss: (id?: string) => hotToast.dismiss(id),
  };
}

export default useToast;
