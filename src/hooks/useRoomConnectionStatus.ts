import { useEffect } from "react";
import { WebRTCService } from "@/utils/webrtc";

type UseRoomConnectionStatusProps = {
  webrtcRef: React.MutableRefObject<WebRTCService | null>;
  setConnected: (connected: boolean) => void;
  peers: string[];
  setIsTextLoading: (loading: boolean) => void;
};

export function useRoomConnectionStatus({
  webrtcRef,
  setConnected,
  peers,
  setIsTextLoading,
}: UseRoomConnectionStatusProps) {
  useEffect(() => {
    if (!webrtcRef.current) return;
    const connectionStatusInterval = setInterval(() => {
      if (webrtcRef.current) {
        setConnected(webrtcRef.current.isConnected());
      }
    }, 1000);
    // Check if we're the first peer or not
    const timeout = setTimeout(() => {
      if (setIsTextLoading && peers.length === 0) {
        setIsTextLoading(false);
      }
    }, 2000);
    return () => {
      clearInterval(connectionStatusInterval);
      clearTimeout(timeout);
    };
  }, [webrtcRef, setConnected, peers, setIsTextLoading]);
}
