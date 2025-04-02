import { PeerMessage, SharedFile } from "@/types/webrtc";

type MessageHandlerConfig = {
  userId: string;
  setText: (text: string) => void;
  setIsTextLoading: (loading: boolean) => void;
  setSharedFiles: React.Dispatch<React.SetStateAction<SharedFile[]>>;
  setPeers: React.Dispatch<React.SetStateAction<string[]>>;
  isTextLoading: boolean;
  isUpdatingTextRef: React.MutableRefObject<boolean>;
  setDownloadingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export function createMessageHandler(config: MessageHandlerConfig) {
  const {
    userId,
    setText,
    setIsTextLoading,
    setSharedFiles,
    setPeers,
    isTextLoading,
    isUpdatingTextRef,
    setDownloadingFiles,
  } = config;

  return function handleWebRTCMessage(message: PeerMessage) {
    // Ignore messages from self
    if (message.sender === userId) return;

    switch (message.type) {
      case "text-update":
        handleTextUpdateMessage(message);
        break;
      case "file-metadata":
        handleFileMetadataMessage(message);
        break;
      case "file-request":
        // This will be handled in WebRTCService directly
        break;
      case "file-response":
        handleFileResponseMessage(message);
        break;
      case "user-joined":
        handleUserJoinedMessage(message);
        break;
      case "room-state-request":
        // This will be handled in WebRTCService directly
        break;
      case "room-state-response":
        handleRoomStateResponseMessage(message);
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  function handleTextUpdateMessage(
    message: Extract<PeerMessage, { type: "text-update" }>
  ) {
    if (message.sender !== userId) {
      isUpdatingTextRef.current = true;
      setText(message.data); // TS now expects a string here too
      setTimeout(() => {
        isUpdatingTextRef.current = false;
      }, 10);
    }
  }

  function handleFileMetadataMessage(
    message: Extract<PeerMessage, { type: "file-metadata" }>
  ) {
    setSharedFiles((prev) => {
      if (prev.some((file) => file.id === message.data.id)) {
        return prev;
      }
      return [...prev, { ...message.data, sender: message.sender }];
    });
  }

  function handleFileResponseMessage(
    message: Extract<PeerMessage, { type: "file-response" }>
  ) {
    const fileData = message.data;
    setSharedFiles((prev) =>
      prev.map((file) =>
        file.id === fileData.id ? { ...file, content: fileData.content } : file
      )
    );

    const link = document.createElement("a");
    link.href = fileData.content as string; // if content may be ArrayBuffer, adjust accordingly
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadingFiles((prev) => {
      const updated = new Set(prev);
      updated.delete(fileData.id);
      return updated;
    });
  }

  function handleUserJoinedMessage(
    message: Extract<PeerMessage, { type: "user-joined" }>
  ) {
    setPeers((prev) => {
      if (!prev.includes(message.sender)) {
        return [...prev, message.sender];
      }
      return prev;
    });
  }

  function handleRoomStateResponseMessage(
    message: Extract<PeerMessage, { type: "room-state-response" }>
  ) {
    if (message.sender === userId) return;
    // This message contains the initial state of the room
    if (isTextLoading) {
      setIsTextLoading(false);
    }
    const { text, files } = message.data;
    setText(text);
    setSharedFiles(files);
  }
}
// This function handles the incoming messages from WebRTC connections.
