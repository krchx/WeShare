import { useEffect, useRef, useReducer, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileData } from "@/types/webrtc";
import { useError } from "@/context/ErrorContext";
import { RoomManager } from "@/services/room-manager";
import { handleError } from "@/lib/utils";
import { downloadFileFromArrayBuffer } from "@/utils/fileDownload";

export function useRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { showError, showSuccess } = useError();

  const roomManagerRef = useRef<RoomManager | null>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Initialize RoomManager
  useEffect(() => {
    if (!roomId) return;

    try {
      const roomManager = new RoomManager(roomId);
      roomManagerRef.current = roomManager;

      // Subscribe to state changes
      const handleChange = () => {
        forceUpdate();
      };

      roomManager.on("change", handleChange);

      // Listen for file-ready events and auto-download
      const handleFileReady = (fileData: FileData) => {
        if (fileData.content instanceof ArrayBuffer) {
          downloadFileFromArrayBuffer(
            fileData.content,
            fileData.name,
            fileData.type
          );
          showSuccess(`Downloaded ${fileData.name}`);
        }
      };

      roomManager.on("file-ready", handleFileReady);

      const cleanup = () => {
        roomManager.off("change", handleChange);
        roomManager.off("file-ready", handleFileReady);
        roomManager.disconnect();
      };

      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue =
          "All shared files will be lost and you will join as a new peer. Are you sure?";
        cleanup();
      };

      const handleUnload = () => {
        cleanup();
      };

      // Register event listeners
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("unload", handleUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("unload", handleUnload);
        cleanup();
      };
    } catch (error) {
      handleError(error, "Failed to initialize room");
    }
  }, [roomId]);

  const roomManager = roomManagerRef.current;

  // Handle file downloads with auto-download logic
  const downloadFile = useCallback(
    (fileMetadata: FileData) => {
      try {
        if (!roomManager) {
          showError("Connection not available. Please try again.");
          return;
        }

        // If file has content and it's an ArrayBuffer, download it immediately
        // if (fileMetadata.content instanceof ArrayBuffer) {
        //   downloadFileFromArrayBuffer(
        //     fileMetadata.content,
        //     fileMetadata.name,
        //     fileMetadata.type
        //   );
        //   showSuccess(`Downloaded ${fileMetadata.name}`);
        //   return;
        // }

        // // Check if already downloading to prevent duplicate requests
        // if (fileMetadata.isDownloading) {
        //   return;
        // }

        // Request file from peer (will auto-download when content arrives via file-ready event)
        roomManager.requestFile(fileMetadata.id, fileMetadata.sender);
      } catch (error) {
        handleError(error, "Failed to download file. Please try again.");
      }
    },
    [roomManager, showError, showSuccess]
  );

  // Update text
  const updateText = useCallback(
    (newText: string) => {
      if (roomManager) {
        roomManager.sendTextUpdate(newText);
      }
    },
    [roomManager]
  );

  // Handle file uploads
  const handleFileUpload = useCallback(
    (files: FileList) => {
      try {
        if (files.length > 0 && roomManager) {
          const fileArray = Array.from(files);
          roomManager.addFiles(fileArray);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload files";
        showError(errorMessage);
      }
    },
    [roomManager, showError]
  );

  // If not initialized, return loading state
  if (!roomManager) {
    return {
      roomId,
      userId: "",
      text: "",
      isTextLoading: true,
      localFiles: [],
      sharedFiles: [],
      peers: [],
      connected: false,
      updateText,
      handleFileUpload,
      downloadFile,
    };
  }

  // Return current state from manager + action methods
  return {
    roomId,
    userId: roomManager.getUserId(),
    text: roomManager.getText(),
    isTextLoading: roomManager.isTextLoading(),
    localFiles: roomManager.getMyFiles(),
    sharedFiles: roomManager.getPeerFiles(),
    peers: roomManager.getConnectedPeers(),
    connected: roomManager.isConnected(),
    updateText,
    handleFileUpload,
    downloadFile,
  };
}
