import { useState, useRef, useEffect } from "react";
import { FirebaseService } from "@/services/firebase";
import { useError } from "@/context/ErrorContext";
import { handleError } from "@/lib/utils";
import { FirebaseError} from "@/lib/errors";

export function useRoomCreation(onSuccess: (roomId: string) => void) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [roomId, setRoomId] = useState("");
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showError } = useError();

  // Automatic availability check with debounce
  useEffect(() => {
    if (roomId) {
      setIsAvailable(null);
      setError("");

      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      if (/^[a-zA-Z0-9]{3,10}$/.test(roomId)) {
        checkTimeoutRef.current = setTimeout(() => {
          checkAvailability(roomId);
        }, 1000);
      }
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [roomId]);

  const checkAvailability = async (id: string) => {
    if (!id.trim()) return;

    if (!/^[a-zA-Z0-9]{3,10}$/.test(id)) {
      setError("Room name must be 3-10 alphanumeric characters");
      return;
    }

    setIsChecking(true);
    try {
      const exists = await FirebaseService.checkRoomExists(id);
      setIsAvailable(!exists);
      setError(exists ? "This room name is already taken" : "");
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError("Unable to check room availability. Please try again.");
        showError("Connection error while checking room availability");
      } else {
        handleError(error, "Failed to check room availability");
        setError("Error checking availability");
      }
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const createRoom = async () => {
    if (!roomId.trim()) {
      setError("Please enter a room name");
      return false;
    }

    if (!/^[a-zA-Z0-9]{3,10}$/.test(roomId)) {
      setError("Room name must be 3-10 alphanumeric characters");
      return false;
    }

    setIsChecking(true);
    try {
      const exists = await FirebaseService.checkRoomExists(roomId);

      if (exists) {
        setIsAvailable(false);
        setError("This room name is already taken");
        return false;
      }

      setIsAvailable(true);
      setTimeout(() => {
        onSuccess(roomId);
      }, 500);
      return true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError("Unable to create room. Please try again.");
        showError("Connection error while creating room");
      } else {
        handleError(error, "Failed to create room");
        setError("Error creating room");
      }
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    roomId,
    setRoomId,
    isChecking,
    error,
    isAvailable,
    createRoom,
  };
}
