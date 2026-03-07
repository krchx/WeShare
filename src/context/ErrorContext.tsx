"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Toaster, toast } from "sonner";

interface ErrorContextType {
  showError: (message: string, error?: unknown) => void;
  showSuccess: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const showError = useCallback((message: string, error?: unknown) => {
    // Log the error for debugging if provided
    if (error) {
      console.error(error);
    }
    toast.error(message);
  }, []);

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "!border !border-[var(--line)] dark:!border-[var(--line-dark)] !bg-[rgba(255,250,242,0.9)] dark:!bg-[rgba(31,27,23,0.92)] !text-[var(--ink)] dark:!text-[var(--ink-dark)] !rounded-[20px] !shadow-[0_14px_30px_rgba(82,67,50,0.16)] dark:!shadow-[0_16px_34px_rgba(0,0,0,0.35)] backdrop-blur-md",
        }}
      />
    </ErrorContext.Provider>
  );
};
