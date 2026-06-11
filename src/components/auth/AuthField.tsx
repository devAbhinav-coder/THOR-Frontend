"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { authFieldInput, authFieldLabel } from "@/lib/authHeritageTheme";

export type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  embedded?: boolean;
  label?: string;
  labelAction?: React.ReactNode;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
};

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      embedded = false,
      className,
      label,
      labelAction,
      error,
      hint,
      suffix,
      id,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const invalid = Boolean(error) || ariaInvalid === true;
    return (
      <div className="space-y-1">
        {(label || labelAction) && (
          <div className="flex items-center justify-between gap-3">
            {label ?
              <label htmlFor={id} className={authFieldLabel(embedded)}>
                {label}
              </label>
            : <span />}
            {labelAction}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={invalid}
            className={cn(
              authFieldInput(embedded),
              invalid && "border-red-400 focus-visible:border-red-500",
              suffix && "pr-10",
              className,
            )}
            {...props}
          />
          {suffix ?
            <div className="absolute inset-y-0 right-0 flex items-center">{suffix}</div>
          : null}
        </div>
        {error ?
          <p className="text-xs text-red-600">{error}</p>
        : hint ?
          <p className="text-[11px] text-gray-500">{hint}</p>
        : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";

export default AuthField;
