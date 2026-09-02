import type { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'neutral';
}

export function Badge({ children, tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
