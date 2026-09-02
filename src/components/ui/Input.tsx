import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className={`field__input ${error ? 'field__input--error' : ''}`} {...props} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}
