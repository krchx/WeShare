import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { WebRTCService } from "@/utils/webrtc";
import { SharedFile, PeerMessage } from "@/types/webrtc";

export function useRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [text, setText] = useState("");
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [isTextLoading, setIsTextLoading] = useState(true);
  const textRef = useRef("");

  const webrtcRef = useRef<WebRTCService | null>(null);
  const isUpdatingTextRef = useRef(false);

  // Set up WebRTC service and message handling
  useEffect(() => {
    if (!roomId) return;

    const webrtcService = new WebRTCService(roomId, getEditorText);
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

    const unsubscribe = webrtcService.onMessage((message: PeerMessage) => {
      if (message.type === "editor-text") {
        if (message.sender !== webrtcService.getUserId()) {
          isUpdatingTextRef.current = true;
          setText(message.data);
          setTimeout(() => {
            isUpdatingTextRef.current = false;
          }, 10);
        }
        // If we're still loading and received text, we can enable the editor
        if (isTextLoading) {
          setIsTextLoading(false);
        }
      }
      if (
        message.type === "text-update" &&
        message.sender !== webrtcService.getUserId()
      ) {
        isUpdatingTextRef.current = true;
        setText(message.data);
        setTimeout(() => {
          isUpdatingTextRef.current = false;
        }, 10);
      } else if (message.type === "file-share") {
        setSharedFiles((prev) => [
          ...prev,
          { ...message.data, sender: message.sender },
        ]);
      } else if (message.type === "user-joined") {
        setPeers((prev) => {
          if (!prev.includes(message.sender)) {
            return [...prev, message.sender];
          }
          return prev;
        });
      }
    });

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
  }, [text]);

  // Get initial text from the editor
  const getEditorText = () => {
    return textRef.current;
  };

  // Update text and broadcast changes
  const updateText = (newText: string) => {
    setText(newText);
    if (!isUpdatingTextRef.current && webrtcRef.current) {
      webrtcRef.current.updateText(newText);
    }
  };

  // Handle file uploads and share via WebRTC
  const handleFileUpload = (files: FileList) => {
    if (files.length > 0) {
      const newFiles = Array.from(files);
      setLocalFiles((prev) => [...prev, ...newFiles]);

      if (webrtcRef.current) {
        newFiles.forEach((file) => {
          webrtcRef.current?.shareFile(file);
        });
      }
    }
  };

  // Download a shared file
  const downloadFile = (fileData: SharedFile) => {
    const link = document.createElement("a");
    link.href = fileData.content as string;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  };
}
