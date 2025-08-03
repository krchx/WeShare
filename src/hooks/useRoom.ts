import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { SharedFile } from "@/types/webrtc";
import { useError } from "@/context/ErrorContext";
import { RoomManager, RoomEventHandler } from "@/services/room-manager";
import { handleError } from "@/lib/utils";
import {
  downloadFileFromArrayBuffer,
  downloadFileFromUrl,
} from "@/utils/fileDownload";

type FileItem = File | SharedFile;

export function useRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { showError, showSuccess } = useError();

  const [text, setText] = useState("");
  const [localFiles, setLocalFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [isTextLoading, setIsTextLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );
  const textRef = useRef("");
  const sharedFilesRef = useRef<SharedFile[]>([]);
  const isUpdatingTextRef = useRef(false);
  const roomManagerRef = useRef<RoomManager | null>(null);

  // Get initial text from the editor
  const getEditorText = () => textRef.current;

  // Get initial file metadata
  const getSharedFiles = () => sharedFilesRef.current;

  // Create room event handler
  const roomEventHandler: RoomEventHandler = {
    onUserJoined: (userId: string) => {
      setPeers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    },
    onUserLeft: (userId: string) => {
      setPeers((prev) => prev.filter((id) => id !== userId));
    },
    onConnected: () => {
      setConnected(true);
    },
    onDisconnected: () => {
      setConnected(false);
    },
    onError: (error: Error) => {
      showError(error.message);
    },
    onTextUpdated: (newText: string) => {
      if (!isUpdatingTextRef.current) {
        isUpdatingTextRef.current = true;
        setText(newText);
        setTimeout(() => {
          isUpdatingTextRef.current = false;
        }, 0);
      }
      setIsTextLoading(false);
    },
    onFileAdded: (file: SharedFile) => {
      setSharedFiles((prev) => {
        // Avoid duplicates
        if (prev.find((f) => f.id === file.id)) {
          return prev;
        }
        return [...prev, file];
      });
    },
    onFileRemoved: (fileId: string) => {
      setSharedFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    onFileReceived: (fileId: string, fileData: ArrayBuffer) => {
      // Find the file in sharedFiles, not in the closure
      setSharedFiles((currentSharedFiles) => {
        const file = currentSharedFiles.find((f) => f.id === fileId);
        if (file) {
          downloadFileFromArrayBuffer(fileData, file.name, file.type);

          setDownloadingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
          showSuccess(`Downloaded ${file.name}`);
        }
        return currentSharedFiles;
      });
    },
    onLeaderChanged: () => {
      // Leader changes are handled internally by RoomManager
    },
    onConnectionStatusChanged: (isConnected: boolean) => {
      setConnected(isConnected);
    },
  };

  // Initialize RoomManager
  useEffect(() => {
    if (!roomId) return;

    try {
      const roomManager = new RoomManager(
        roomId,
        getEditorText,
        getSharedFiles,
        roomEventHandler
      );
      roomManagerRef.current = roomManager;
      setUserId(roomManager.getUserId());

      return () => {
        roomManager.disconnect();
      };
    } catch (error) {
      handleError(error, "Failed to initialize room");
      setIsTextLoading(false);
    }
  }, [roomId]);

  // Update text and broadcast changes
  const updateText = useCallback((newText: string) => {
    setText(newText);
    if (!isUpdatingTextRef.current && roomManagerRef.current) {
      roomManagerRef.current.sendTextUpdate(newText);
    }
  }, []);

  // Handle file uploads and share metadata via RoomManager
  const handleFileUpload = useCallback(
    (files: FileList) => {
      try {
        if (files.length > 0 && roomManagerRef.current) {
          const fileArray = Array.from(files);
          const fileIds = roomManagerRef.current.addFiles(fileArray);

          const uploadedFiles: SharedFile[] = fileArray.map((file, index) => ({
            id: fileIds[index],
            name: file.name,
            type: file.type,
            size: file.size,
            sender: userId,
            content: URL.createObjectURL(file),
          }));

          setLocalFiles((prev) => [...prev, ...uploadedFiles]);
        }
      } catch (error) {
        // Use showError for user-facing file upload errors
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload files";
        showError(errorMessage);
      }
    },
    [userId, showError]
  );

  // Download a shared file by requesting it from the owner
  const downloadFile = useCallback(
    (fileMetadata: SharedFile) => {
      try {
        if (!roomManagerRef.current) {
          showError("Connection not available. Please try again.");
          return;
        }

        if (fileMetadata.content) {
          downloadFileFromUrl(
            fileMetadata.content as string,
            fileMetadata.name
          );
          return;
        }

        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.add(fileMetadata.id);
          return newSet;
        });

        roomManagerRef.current.requestFile(
          fileMetadata.id,
          fileMetadata.sender
        );
      } catch (error) {
        handleError(error, "Failed to download file. Please try again.");
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileMetadata.id);
          return newSet;
        });
      }
    },
    [showError]
  );

  useEffect(() => {
    textRef.current = text;
    sharedFilesRef.current = sharedFiles;
  }, [text, sharedFiles]);

  return {
    roomId,
    text,
    updateText,
    localFiles,
    sharedFiles,
    handleFileUpload,
    downloadFile,
    connected,
    peers,
    userId,
    isTextLoading,
    downloadingFiles,
  };
}
