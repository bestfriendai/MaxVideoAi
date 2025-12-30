'use client';

import React, { memo, useEffect, useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Transition variants
const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
};

const transitionVariants = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideLeft: slideLeftVariants,
  scale: scaleVariants,
};

type TransitionType = keyof typeof transitionVariants;

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: TransitionType;
  duration?: number;
  className?: string;
}

export const PageTransition = memo(function PageTransition({
  children,
  variant = 'slideUp',
  duration = 0.3,
  className,
}: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={transitionVariants[variant]}
        transition={{ duration, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

// Staggered children animation
interface StaggeredListProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggeredList = memo(function StaggeredList({
  children,
  staggerDelay = 0.1,
  className,
}: StaggeredListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className={className}
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
});

// Loading bar at top of page (like NProgress)
interface LoadingBarContextType {
  isLoading: boolean;
  start: () => void;
  done: () => void;
}

const LoadingBarContext = createContext<LoadingBarContextType | null>(null);

export function useLoadingBar() {
  const context = useContext(LoadingBarContext);
  if (!context) {
    throw new Error('useLoadingBar must be used within LoadingBarProvider');
  }
  return context;
}

export function LoadingBarProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const start = () => setIsLoading(true);
  const done = () => setIsLoading(false);

  return (
    <LoadingBarContext.Provider value={{ isLoading, start, done }}>
      {children}
      <LoadingBar isLoading={isLoading} />
    </LoadingBarContext.Provider>
  );
}

interface LoadingBarProps {
  isLoading: boolean;
}

const LoadingBar = memo(function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(timer);
    } else {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (progress === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] h-1 overflow-hidden">
      <motion.div
        className="h-full bg-purple-500"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
});

// Full page loading spinner
interface PageLoaderProps {
  message?: string;
  className?: string;
}

export const PageLoader = memo(function PageLoader({
  message = 'Loading...',
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center gap-4',
        className
      )}
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-700 border-t-purple-500" />
      </div>
      {message && <p className="text-gray-400">{message}</p>}
    </div>
  );
});

// Inline loading spinner
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
};

export const Spinner = memo(function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-700 border-t-purple-500',
        spinnerSizes[size],
        className
      )}
    />
  );
});

// Suspense fallback with nice animation
interface SuspenseFallbackProps {
  variant?: 'page' | 'section' | 'inline';
  message?: string;
}

export const SuspenseFallback = memo(function SuspenseFallback({
  variant = 'section',
  message,
}: SuspenseFallbackProps) {
  if (variant === 'inline') {
    return <Spinner size="sm" className="mx-auto" />;
  }

  if (variant === 'page') {
    return <PageLoader message={message} className="min-h-screen" />;
  }

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="md" />
    </div>
  );
});

// Animated content reveal
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const Reveal = memo(function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  className,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Fade in when in viewport
interface FadeInWhenVisibleProps {
  children: React.ReactNode;
  className?: string;
}

export const FadeInWhenVisible = memo(function FadeInWhenVisible({
  children,
  className,
}: FadeInWhenVisibleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Pulse animation for attention
interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const Pulse = memo(function Pulse({
  children,
  active = true,
  className,
}: PulseProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Skeleton page layouts
export const SkeletonPage = memo(function SkeletonPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
        <div className="h-8 w-64 animate-pulse rounded bg-gray-800" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-800" />
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="space-y-3">
              <div className="h-32 animate-pulse rounded-lg bg-gray-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export const SkeletonDashboard = memo(function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-800" />
              <div className="h-6 w-16 animate-pulse rounded bg-gray-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="h-64 animate-pulse rounded-lg bg-gray-800" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
        </div>
        <div className="divide-y divide-gray-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-800" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-800" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
