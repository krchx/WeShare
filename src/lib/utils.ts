import { toast } from "sonner";
import {
  AppError,
} from "./errors";

/**
 * Handles errors by displaying a toast notification with a contextual message.
 * For critical errors, it logs the full error to the console for debugging.
 *
 * @param error The error object to handle.
 * @param fallbackMessage A fallback user-friendly message if no specific handling is found.
 */
export const handleError = (
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
) => {
  // Log the full error for debugging purposes
  console.error(error);

  let userMessage = fallbackMessage;

  // Handle different types of errors with specific messages
  if (error instanceof AppError) {
    userMessage = error.message;
  } else if (error instanceof Error) {
    // Handle common JavaScript errors
    if (error.name === "NetworkError" || error.message.includes("network")) {
      userMessage = "Network error. Please check your internet connection.";
    } else if (
      error.name === "TimeoutError" ||
      error.message.includes("timeout")
    ) {
      userMessage = "Request timed out. Please try again.";
    } else {
      userMessage = error.message || fallbackMessage;
    }
  }

  // Show a user-friendly toast message
  toast.error(userMessage);
};
