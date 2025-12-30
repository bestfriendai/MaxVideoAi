'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full bg-surface text-text-primary placeholder:text-text-muted transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-border focus:border-accent focus:ring-2 focus:ring-ring/20',
        filled:
          'bg-bg border-transparent focus:bg-surface focus:border-accent focus:ring-2 focus:ring-ring/20',
        flushed:
          'border-0 border-b-2 border-border rounded-none px-0 focus:border-accent',
        unstyled: 'border-0 bg-transparent p-0',
      },
      inputSize: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-3 text-sm rounded-input',
        lg: 'h-12 px-4 text-base rounded-input',
      },
      hasError: {
        true: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  label?: string;
  description?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      variant,
      inputSize,
      hasError,
      leftIcon,
      rightIcon,
      error,
      label,
      description,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;
    const showError = !!error || hasError;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {description && (
          <p className="text-xs text-text-muted">{description}</p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant, inputSize, hasError: showError }),
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              className
            )}
            aria-invalid={showError ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
