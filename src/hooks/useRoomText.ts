import { useCallback } from "react";
import { WebRTCService } from "@/utils/webrtc";

type UseRoomTextProps = {
  webrtcRef: React.MutableRefObject<WebRTCService | null>;
  isUpdatingTextRef: React.MutableRefObject<boolean>;
  setText: (text: string) => void;
};

export function useRoomText({
  webrtcRef,
  isUpdatingTextRef,
  setText,
}: UseRoomTextProps) {
  // Update text and broadcast changes
  const updateText = useCallback(
    (newText: string) => {
      setText(newText);
      if (!isUpdatingTextRef.current && webrtcRef.current) {
        webrtcRef.current.updateText(newText);
      }
    },
    [setText, isUpdatingTextRef, webrtcRef]
  );

  return { updateText };
}
