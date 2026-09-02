import type { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Alert({ children, tone = 'info', className = '' }: AlertProps) {
  return <div className={`alert alert--${tone} ${className}`}>{children}</div>;
}

