import { useCallback } from "react";
import { SharedFile } from "@/types/webrtc";
import { handleError } from "@/lib/utils";
import { WebRTCService } from "@/utils/webrtc";

type FileItem = File | SharedFile;

type UseFileSharingProps = {
  webrtcRef: React.MutableRefObject<WebRTCService | null>;
  userId: string;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  setLocalFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  setDownloadingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export function useFileSharing({
  webrtcRef,
  userId,
  showError,
  setLocalFiles,
  setDownloadingFiles,
}: UseFileSharingProps) {
  // Handle file uploads and share metadata via WebRTC
  const handleFileUpload = useCallback(
    (files: FileList) => {
      try {
        if (files.length > 0 && webrtcRef.current) {
          const newFiles = Array.from(files);
          const maxFileSize = 50 * 1024 * 1024; // 50MB
          const oversizedFiles = newFiles.filter(
            (file) => file.size > maxFileSize
          );
          if (oversizedFiles.length > 0) {
            showError(
              `Files must be smaller than 50MB. ${oversizedFiles.length} file(s) were too large.`
            );
            return;
          }
          const uploadedFiles: SharedFile[] = newFiles.map((file) => {
            const fileId = webrtcRef.current!.shareFile(file);
            return {
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              sender: userId,
              content: URL.createObjectURL(file),
            };
          });
          setLocalFiles((prev: FileItem[]) => [...prev, ...uploadedFiles]);
        }
      } catch (error) {
        handleError(error, "Failed to upload files. Please try again.");
      }
    },
    [webrtcRef, userId, showError, setLocalFiles]
  );

  // Download a shared file by requesting it from the owner
  const downloadFile = useCallback(
    (fileMetadata: SharedFile) => {
      try {
        if (!webrtcRef.current) {
          showError("Connection not available. Please try again.");
          return;
        }
        if (fileMetadata.content) {
          const link = document.createElement("a");
          link.href = fileMetadata.content as string;
          link.download = fileMetadata.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        setDownloadingFiles((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.add(fileMetadata.id);
          return newSet;
        });
        webrtcRef.current.requestFile(fileMetadata.id, fileMetadata.sender);
      } catch (error) {
        handleError(error, "Failed to download file. Please try again.");
        setDownloadingFiles((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(fileMetadata.id);
          return newSet;
        });
      }
    },
    [webrtcRef, showError, setDownloadingFiles]
  );

  return { handleFileUpload, downloadFile };
}
