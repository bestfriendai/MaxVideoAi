'use client';

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const selectVariants = cva(
  'flex w-full bg-surface text-text-primary transition-colors cursor-pointer appearance-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-border focus:border-accent focus:ring-2 focus:ring-ring/20',
        filled:
          'bg-bg border-transparent focus:bg-surface focus:border-accent focus:ring-2 focus:ring-ring/20',
      },
      selectSize: {
        sm: 'h-8 px-3 pr-8 text-xs rounded-lg',
        md: 'h-10 px-3 pr-10 text-sm rounded-input',
        lg: 'h-12 px-4 pr-12 text-base rounded-input',
      },
      hasError: {
        true: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      selectSize: 'md',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  label?: string;
  description?: string;
  leftIcon?: ReactNode;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      variant,
      selectSize,
      hasError,
      options,
      placeholder,
      error,
      label,
      description,
      leftIcon,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;
    const showError = !!error || hasError;
    const hasLeftIcon = !!leftIcon;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              selectVariants({ variant, selectSize, hasError: showError }),
              hasLeftIcon && 'pl-10',
              className
            )}
            aria-invalid={showError ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
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

Select.displayName = 'Select';

export { Select, selectVariants };
