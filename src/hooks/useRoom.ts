import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { SharedFile } from "@/types/webrtc";
import { useError } from "@/context/ErrorContext";
import { useWebRTCConnection } from "./useWebRTCConnection";
import { useFileSharing } from "./useFileSharing";
import { useRoomText } from "./useRoomText";
import { useRoomConnectionStatus } from "./useRoomConnectionStatus";
import { useShareRoom } from "./useShareRoom";

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

  // Get initial text from the editor
  const getEditorText = () => textRef.current;

  // Get initial file metadata
  const getSharedFiles = () => sharedFilesRef.current;

  // Use the WebRTC connection hook
  const webrtcRef = useWebRTCConnection({
    roomId,
    getEditorText,
    getSharedFiles,
    setText,
    setIsTextLoading,
    setSharedFiles,
    setPeers,
    isTextLoading,
    isUpdatingTextRef,
    setDownloadingFiles,
    setUserId,
    setConnected,
    peers,
  });

  // Use the room connection status hook
  useRoomConnectionStatus({
    webrtcRef,
    setConnected,
    peers,
    setIsTextLoading,
  });

  // Use the room text hook
  const { updateText } = useRoomText({
    webrtcRef,
    isUpdatingTextRef,
    setText,
  });

  // Use the file sharing hook
  const { handleFileUpload, downloadFile } = useFileSharing({
    webrtcRef,
    userId,
    showError,
    showSuccess,
    setLocalFiles,
    setDownloadingFiles,
  });

  // Use the share room hook
  const { shareRoom } = useShareRoom({ showSuccess, showError });

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
    shareRoom,
    isTextLoading,
    downloadingFiles,
  };
}
