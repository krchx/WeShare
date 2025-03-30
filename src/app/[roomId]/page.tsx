"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { WebRTCService } from "@/utils/webrtc";
import { ConnectionStatus } from "@/components/room/ConnectionStatus";
import { TextEditor } from "@/components/room/TextEditor";
import { FileSharing } from "@/components/room/FileSharing";
import { RoomInfo } from "@/components/room/RoomInfo";
import { SharedFile, PeerMessage } from "@/types/webrtc";

export default function Room() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [text, setText] = useState("");
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const webrtcRef = useRef<WebRTCService | null>(null);
  const isUpdatingTextRef = useRef(false);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!roomId) return;

    // Create WebRTC service
    const webrtcService = new WebRTCService(roomId);
    webrtcRef.current = webrtcService;

    // Set user ID
    setUserId(webrtcService.getUserId());

    // Set up message handler
    const unsubscribe = webrtcService.onMessage((message: PeerMessage) => {
      // console.log("Received message:", message.type);

      if (
        message.type === "text-update" &&
        message.sender !== webrtcService.getUserId()
      ) {
        // Prevent recursive updates
        isUpdatingTextRef.current = true;
        setText(message.data);
        setTimeout(() => {
          isUpdatingTextRef.current = false;
        }, 10);
      } else if (message.type === "file-share") {
        const fileData = message.data;
        setSharedFiles((prev) => [
          ...prev,
          {
            ...fileData,
            sender: message.sender,
          },
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

    // Update connection status
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

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Only broadcast if this is a local change (not from peers)
    if (!isUpdatingTextRef.current && webrtcRef.current) {
      webrtcRef.current.updateText(newText);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setLocalFiles((prev) => [...prev, ...newFiles]);

      // Share each file via WebRTC
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

  // Share room link
  const shareRoom = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-100  bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/room-bg.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ConnectionStatus
        roomId={roomId}
        connected={connected}
        peerCount={peers.length}
        userId={userId}
        onShareRoom={shareRoom}
      />

      <div className="flex flex-col md:flex-row flex-1">
        <TextEditor text={text} onChange={handleTextChange} />

        <div className="flex flex-col md:w-80 border-2 border-gray-300 rounded-lg p-4 mx-4 my-2 md:my-4 bg-blue-300/30 backdrop-blur-sm">
          <FileSharing
            localFiles={localFiles}
            sharedFiles={sharedFiles}
            onFileUpload={handleFileUpload}
            onDownloadFile={downloadFile}
          />

          <RoomInfo roomId={roomId} peers={peers} userId={userId} />
        </div>
      </div>
    </div>
  );
}
