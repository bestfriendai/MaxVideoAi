'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReportBug = (): void => {
    const { error, errorInfo } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(
      `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`
    );
    window.open(`mailto:support@maxvideoai.com?subject=${subject}&body=${body}`);
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Please try again or contact
              support if the problem persists.
            </p>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-400 mb-2">
                  {error.message}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                variant="secondary"
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>

              <Button
                variant="ghost"
                onClick={this.handleReportBug}
                className="gap-2"
              >
                <Bug className="w-4 h-4" />
                Report Bug
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Functional wrapper for easier use
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryWrapperProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// Simple inline error fallback component
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400">
            {error?.message || 'An error occurred'}
          </p>
          {resetError && (
            <button
              onClick={resetError}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Page-level error boundary with more context
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // In production, you would send this to an error tracking service
        if (process.env.NODE_ENV === 'production') {
          // sendToErrorTracking(error, errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Section-level error boundary with compact fallback
export function SectionErrorBoundary({
  children,
  name = 'section',
}: {
  children: ReactNode;
  name?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center text-gray-400">
          <p>Unable to load {name}.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
          >
            Refresh page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
