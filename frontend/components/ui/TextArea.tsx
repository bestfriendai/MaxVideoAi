'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex w-full bg-surface text-text-primary placeholder:text-text-muted transition-colors resize-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-border focus:border-accent focus:ring-2 focus:ring-ring/20',
        filled:
          'bg-bg border-transparent focus:bg-surface focus:border-accent focus:ring-2 focus:ring-ring/20',
        flushed:
          'border-0 border-b-2 border-border rounded-none px-0 focus:border-accent',
      },
      textareaSize: {
        sm: 'min-h-[80px] px-3 py-2 text-xs rounded-lg',
        md: 'min-h-[120px] px-3 py-2.5 text-sm rounded-input',
        lg: 'min-h-[160px] px-4 py-3 text-base rounded-input',
      },
      hasError: {
        true: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'md',
    },
  }
);

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  label?: string;
  description?: string;
  showCount?: boolean;
  maxLength?: number;
  containerClassName?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      containerClassName,
      variant,
      textareaSize,
      hasError,
      error,
      label,
      description,
      showCount,
      maxLength,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name;
    const showError = !!error || hasError;
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
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
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            maxLength={maxLength}
            className={cn(
              textareaVariants({ variant, textareaSize, hasError: showError }),
              className
            )}
            aria-invalid={showError ? 'true' : undefined}
            aria-describedby={error ? `${textareaId}-error` : undefined}
            {...props}
          />
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-3 text-xs text-text-muted">
              {charCount}/{maxLength}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${textareaId}-error`}
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

TextArea.displayName = 'TextArea';

export { TextArea, textareaVariants };
