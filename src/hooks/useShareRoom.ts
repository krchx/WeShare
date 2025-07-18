import { useCallback } from "react";
import { handleError } from "@/lib/utils";

export function useShareRoom({
  showSuccess,
  showError,
}: {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const shareRoom = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Room link copied to clipboard!");
    } catch (error) {
      handleError(
        error,
        "Failed to copy room link. Please copy the URL manually."
      );
    }
  }, [showSuccess, showError]);

  return { shareRoom };
}
