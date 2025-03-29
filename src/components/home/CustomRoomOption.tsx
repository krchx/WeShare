import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FirebaseService } from "@/services/firebase";

interface CustomRoomOptionProps {
  onCreateRoom: (roomId: string) => void;
}

export default function CustomRoomOption({
  onCreateRoom,
}: CustomRoomOptionProps) {
  const [customRoomId, setCustomRoomId] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic availability check with 1-second debounce
  useEffect(() => {
    if (customRoomId) {
      setIsAvailable(null);
      setError("");

      // Clear any existing timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      // Only check if the format is valid
      if (/^[a-zA-Z0-9]{3,10}$/.test(customRoomId)) {
        // Set a new timeout
        checkTimeoutRef.current = setTimeout(() => {
          checkAvailability();
        }, 1000);
      }
    }

    // Cleanup function
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [customRoomId]);

  const checkAvailability = async () => {
    if (!customRoomId.trim()) return;

    // Validate room name format
    if (!/^[a-zA-Z0-9]{3,10}$/.test(customRoomId)) {
      setError("Room name must be 3-10 alphanumeric characters");
      return;
    }

    setIsChecking(true);
    try {
      const exists = await FirebaseService.checkRoomExists(customRoomId);
      setIsAvailable(!exists);
      setError(exists ? "This room name is already taken" : "");
    } catch (err) {
      setError("Error checking availability");
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!customRoomId.trim()) {
      setError("Please enter a room name");
      return;
    }

    // Validate room name format
    if (!/^[a-zA-Z0-9]{3,10}$/.test(customRoomId)) {
      setError("Room name must be 3-10 alphanumeric characters");
      return;
    }

    setIsChecking(true);
    try {
      const exists = await FirebaseService.checkRoomExists(customRoomId);
      setIsChecking(false);

      if (exists) {
        setIsAvailable(false);
        setError("This room name is already taken");
        return;
      }

      // Room is available
      setIsAvailable(true);
      setTimeout(() => {
        onCreateRoom(customRoomId);
      }, 500); // Short delay to show the success state
    } catch (err) {
      setIsChecking(false);
      setError("Error checking room availability");
      console.error(err);
    }
  };

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Enter custom room name (3-10 chars)"
          value={customRoomId}
          onChange={(e) => setCustomRoomId(e.target.value.trim())}
          className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
            isAvailable === true
              ? "border-green-500 bg-green-50"
              : isAvailable === false
              ? "border-red-500 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
          maxLength={10}
        />
        {isChecking && (
          <div className="absolute right-2 top-2 px-3 py-1 text-gray-500 text-sm flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Checking...
          </div>
        )}
      </div>
      {customRoomId && (
        <div className="mt-2 text-sm">
          {isAvailable === true && (
            <p className="text-green-600">✓ This room name is available</p>
          )}
          {isAvailable === false && (
            <p className="text-red-600">✗ This room name is already taken</p>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {!error && !isAvailable && customRoomId && (
            <p className="text-gray-500">
              Room name must be 3-10 alphanumeric characters
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleCreateRoom}
        disabled={!customRoomId.trim() || isAvailable === false || isChecking}
        className={`w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center
          ${
            !customRoomId.trim() || isAvailable === false || isChecking
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100"
          }`}
      >
        {isChecking ? (
          "Creating room..."
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Custom Room
          </>
        )}
      </button>
    </motion.div>
  );
}
