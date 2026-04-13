import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  /** Shown under the field when there is no error (helper text). */
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, id, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const invalid = Boolean(error) || ariaInvalid === true;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white/70">
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          aria-invalid={invalid}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500/40',
            className
          )}
          ref={ref}
          {...props}
        />
        {error ?
          <p className="text-xs text-red-600 animate-in fade-in duration-200">{error}</p>
        : hint ?
          <p className="text-[11px] text-gray-500">{hint}</p>
        : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
