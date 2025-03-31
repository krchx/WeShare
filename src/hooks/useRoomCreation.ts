import { useState, useRef, useEffect } from "react";
import { FirebaseService } from "@/services/firebase";

export function useRoomCreation(onSuccess: (roomId: string) => void) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [roomId, setRoomId] = useState("");
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    } catch (err) {
      setError("Error checking availability");
      console.error(err);
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
    } catch (err) {
      setError("Error checking room availability");
      console.error(err);
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
