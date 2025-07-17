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
      <Toaster richColors position="top-right" />
    </ErrorContext.Provider>
  );
};
