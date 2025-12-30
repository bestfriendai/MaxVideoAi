'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  default: 'bg-accent',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  gradient: 'bg-gradient-to-r from-accent via-accentSoft to-accent',
};

export function Progress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  animated = true,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1.5">
          {label && (
            <span className="text-sm text-text-secondary">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-border/30 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn('h-full rounded-full', variantClasses[variant])}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const circularVariantClasses = {
  default: 'stroke-accent',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  error: 'stroke-red-500',
};

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  showValue = true,
  variant = 'default',
  className,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={circularVariantClasses[variant]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium text-text-primary">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Step Progress
interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted
                      ? 'bg-accent border-accent text-white'
                      : isCurrent
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-text-muted bg-surface'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent ? 'text-text-primary' : 'text-text-muted'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-0.5 mx-2',
                    isCompleted ? 'bg-accent' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
