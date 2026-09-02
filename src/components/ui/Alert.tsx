import type { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}

export function Alert({ children, tone = 'info' }: AlertProps) {
  return <div className={`alert alert--${tone}`}>{children}</div>;
}
