import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { WebRTCService } from "@/utils/webrtc";
import { SharedFile } from "@/types/webrtc";
import { createMessageHandler } from "@/utils/webrtcMessageHandler";

type FileItem = File | SharedFile;

export function useRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

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
  const webrtcRef = useRef<WebRTCService | null>(null);
  const isUpdatingTextRef = useRef(false);

  // Set up WebRTC service and message handling
  useEffect(() => {
    if (!roomId) return;

    const webrtcService = new WebRTCService(
      roomId,
      getEditorText,
      getSharedFiles
    );
    webrtcRef.current = webrtcService;
    setUserId(webrtcService.getUserId());

    // Check if we're the first peer or not
    setTimeout(() => {
      // If no content received after a timeout and there are no peers,
      // assume we're the first user and enable the editor
      if (isTextLoading && peers.length === 0) {
        setIsTextLoading(false);
      }
    }, 2000); // 2 second timeout

    // Handle incoming messages

    // Create message handler with current state setters
    const handleWebRTCMessage = createMessageHandler({
      userId: webrtcService.getUserId(),
      setText,
      setIsTextLoading,
      setSharedFiles,
      setPeers,
      isTextLoading,
      isUpdatingTextRef,
      setDownloadingFiles,
    });

    // Register the handler
    const unsubscribe = webrtcService.onMessage(handleWebRTCMessage);

    const connectionStatusInterval = setInterval(() => {
      if (webrtcService) {
        setConnected(webrtcService.isConnected());
      }
    }, 1000);

    // Clean up on unmount
    return () => {
      unsubscribe();
      clearInterval(connectionStatusInterval);
      webrtcService.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    textRef.current = text;
    sharedFilesRef.current = sharedFiles;
  }, [text, sharedFiles]);

  // Get initial text from the editor
  const getEditorText = () => {
    return textRef.current;
  };

  // Get initial file metadata
  const getSharedFiles = () => {
    return sharedFilesRef.current;
  };

  // Update text and broadcast changes
  const updateText = (newText: string) => {
    setText(newText);
    if (!isUpdatingTextRef.current && webrtcRef.current) {
      webrtcRef.current.updateText(newText);
    }
  };

  // Handle file uploads and share metadata via WebRTC
  const handleFileUpload = (files: FileList) => {
    if (files.length > 0 && webrtcRef.current) {
      const newFiles = Array.from(files);
      const uploadedFiles: SharedFile[] = newFiles.map((file) => {
        const fileId = webrtcRef.current!.shareFile(file);

        return {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          sender: userId,
          content: URL.createObjectURL(file), // Local content URL
        };
      });

      setLocalFiles((prev) => [...prev, ...uploadedFiles]);
    }
  };

  // Download a shared file by requesting it from the owner
  const downloadFile = (fileMetadata: SharedFile) => {
    if (!webrtcRef.current) return;

    // If we already have the content, create a download link
    if (fileMetadata.content) {
      const link = document.createElement("a");
      link.href = fileMetadata.content as string;
      link.download = fileMetadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Otherwise, request the file from the owner
    setDownloadingFiles((prev) => new Set(prev).add(fileMetadata.id));
    webrtcRef.current.requestFile(fileMetadata.id, fileMetadata.sender);
  };

  // Share room link by copying it to clipboard
  const shareRoom = () => {
    navigator.clipboard.writeText(window.location.href);
  };

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
    shareRoom,
    isTextLoading,
    downloadingFiles,
  };
}
