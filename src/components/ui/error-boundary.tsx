"use client";

import React, { Component, ReactNode } from "react";
import { handleError } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Use our error handling system
    handleError(error, "An unexpected error occurred in the application");
  }

  render() {
    if (this.state.hasError) {
      // Return custom fallback UI or default error message
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[var(--paper-page)] dark:bg-[var(--paper-page-dark)]">
            <div className="paper-panel p-6 max-w-md text-left">
              <div className="inline-flex rounded-full border border-red-200/80 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-red-700 dark:text-red-300 mb-4">
                Recovery mode
              </div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-700/85 dark:text-red-200/80 mb-4 leading-relaxed">
                We&apos;re sorry, but an unexpected error occurred. Please
                refresh the page and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="paper-btn px-4 py-2 text-sm"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
