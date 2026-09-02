import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    className,
  ].join(' ');

  return (
    <button className={classes} {...props}>
      {leftIcon ? <span className="button__icon">{leftIcon}</span> : null}
      {children}
    </button>
  );
}
