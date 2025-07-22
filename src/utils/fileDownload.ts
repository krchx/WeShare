/**
 * Utility functions for file download operations
 */

/**
 * Downloads a file using a blob and triggers browser download
 * @param fileData - The file data as ArrayBuffer
 * @param fileName - The name of the file
 * @param fileType - The MIME type of the file
 */
export function downloadFileFromArrayBuffer(
  fileData: ArrayBuffer,
  fileName: string,
  fileType: string
): void {
  const blob = new Blob([fileData], { type: fileType });
  const url = URL.createObjectURL(blob);
  downloadFileFromUrl(url, fileName);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a file from a URL (blob URL or regular URL)
 * @param url - The URL to download from
 * @param fileName - The name of the file
 */
export function downloadFileFromUrl(url: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * File size constants
 */
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_MB: 50,
} as const;

/**
 * Validates file size against the maximum allowed size
 * @param file - The file to validate
 * @returns true if valid, false if too large
 */
export function validateFileSize(file: File): boolean {
  return file.size <= FILE_SIZE_LIMITS.MAX_FILE_SIZE;
}

/**
 * Gets a human-readable file size string
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
