/**
 * Base class for custom application errors.
 * Allows for easier identification and handling of specific error types.
 */
export class AppError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/**
 * Error thrown when a WebRTC operation fails.
 * This could be due to connection issues, signaling problems, or other peer-to-peer failures.
 */
export class WebRTCError extends AppError {
  constructor(
    message = "A WebRTC error occurred. Please check your connection.",
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Error thrown when a Firebase operation fails.
 * This could be due to permission issues, network problems, or invalid data.
 */
export class FirebaseError extends AppError {
  constructor(
    message = "A database error occurred. Please try again later.",
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Error thrown when a file operation fails.
 * This could be due to the file being too large, of an unsupported type, or read/write errors.
 */
export class FileError extends AppError {
  constructor(
    message = "A file operation failed. Please check the file and try again.",
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Error thrown when room operations fail.
 */
export class RoomError extends AppError {
  constructor(
    message = "Room operation failed. Please try again.",
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Error thrown when network operations fail.
 */
export class NetworkError extends AppError {
  constructor(
    message = "Network error occurred. Please check your connection.",
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Common error codes for the application
 */
export const ERROR_CODES = {
  // WebRTC errors
  WEBRTC_CONNECTION_FAILED: "WEBRTC_CONNECTION_FAILED",
  WEBRTC_PEER_NOT_FOUND: "WEBRTC_PEER_NOT_FOUND",
  WEBRTC_SIGNALING_ERROR: "WEBRTC_SIGNALING_ERROR",

  // Firebase errors
  FIREBASE_PERMISSION_DENIED: "FIREBASE_PERMISSION_DENIED",
  FIREBASE_NETWORK_ERROR: "FIREBASE_NETWORK_ERROR",
  FIREBASE_ROOM_NOT_FOUND: "FIREBASE_ROOM_NOT_FOUND",

  // File errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_INVALID_TYPE: "FILE_INVALID_TYPE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  FILE_DOWNLOAD_FAILED: "FILE_DOWNLOAD_FAILED",

  // Room errors
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  ROOM_FULL: "ROOM_FULL",
  ROOM_ACCESS_DENIED: "ROOM_ACCESS_DENIED",

  // Network errors
  NETWORK_OFFLINE: "NETWORK_OFFLINE",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
