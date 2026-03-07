import { useState } from "react";
import { motion } from "framer-motion";
import { FirebaseService } from "@/services/firebase";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiShuffle } from "react-icons/fi";
import { useError } from "@/context/ErrorContext";

interface RandomRoomOptionProps {
  onCreateRoom: (roomId: string) => void;
}

export default function RandomRoomOption({
  onCreateRoom,
}: RandomRoomOptionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { showError } = useError();

  const handleCreateRoom = async () => {
    let newRoomId;
    let isUnique = false;

    setIsCreating(true);
    setError("");

    try {
      // Try to find a unique room ID
      while (!isUnique) {
        newRoomId = Math.random().toString(36).substring(2, 7);
        const exists = await FirebaseService.checkRoomExists(newRoomId);
        isUnique = !exists;
      }

      if (newRoomId) {
        onCreateRoom(newRoomId);
      } else {
        setError("Failed to generate a valid room ID");
        showError("Failed to generate a unique room ID");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create random room";
      showError(errorMessage);
      setError("Error creating room");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      key="random"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-4 pt-2"
    >
      <div className="text-sm text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] font-mono mb-4 px-1 leading-relaxed">
        A unique 5-character ID will be generated
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3 font-mono flex items-center gap-1 px-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
          {error}
        </p>
      )}

      <button
        onClick={handleCreateRoom}
        disabled={isCreating}
        className={`paper-btn w-full py-3 px-4 flex items-center justify-center
          ${isCreating ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
      >
        {isCreating ? (
          <>
            <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
            Generating ID...
          </>
        ) : (
          <>
            <FiShuffle className="h-5 w-5 mr-2" />
            Generate Random Room
          </>
        )}
      </button>
    </motion.div>
  );
}
