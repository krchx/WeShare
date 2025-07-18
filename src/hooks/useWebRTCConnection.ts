import { useEffect, useRef } from "react";
import { WebRTCService } from "@/utils/webrtc";
import { createMessageHandler } from "@/utils/webrtcMessageHandler";
import { SharedFile } from "@/types/webrtc";

type UseWebRTCConnectionProps = {
  roomId: string;
  getEditorText: () => string;
  getSharedFiles: () => SharedFile[];
  setText: (text: string) => void;
  setIsTextLoading: (loading: boolean) => void;
  setSharedFiles: React.Dispatch<React.SetStateAction<SharedFile[]>>;
  setPeers: React.Dispatch<React.SetStateAction<string[]>>;
  isTextLoading: boolean;
  isUpdatingTextRef: React.MutableRefObject<boolean>;
  setDownloadingFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  setUserId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  peers: string[];
};

export function useWebRTCConnection({
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
}: UseWebRTCConnectionProps) {
  const webrtcRef = useRef<WebRTCService | null>(null);

  useEffect(() => {
    if (!roomId) return;
    try {
      const webrtcService = new WebRTCService(
        roomId,
        getEditorText,
        getSharedFiles
      );
      webrtcRef.current = webrtcService;
      setUserId(webrtcService.getUserId());

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
      const unsubscribe = webrtcService.onMessage(handleWebRTCMessage);

      const connectionStatusInterval = setInterval(() => {
        if (webrtcService) {
          setConnected(webrtcService.isConnected());
        }
      }, 1000);

      setTimeout(() => {
        if (isTextLoading && peers.length === 0) {
          setIsTextLoading(false);
        }
      }, 2000);

      return () => {
        unsubscribe();
        clearInterval(connectionStatusInterval);
        webrtcService.disconnect();
      };
    } catch {
      setIsTextLoading(false);
    }
  }, [roomId]);

  return webrtcRef;
}
