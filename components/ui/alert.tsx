import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
}

export function Alert({ children, variant = 'default', className }: AlertProps) {
  const baseStyles = 'p-4 rounded-lg border';
  const variantStyles = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  );
}

export function AlertTitle({ children }: { children: ReactNode }) {
  return <h5 className="font-medium">{children}</h5>;
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm">{children}</p>;
} 