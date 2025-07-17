import { useState } from "react";
import { motion } from "framer-motion";
import { FirebaseService } from "@/services/firebase";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiShuffle } from "react-icons/fi";
import { useError } from "@/context/ErrorContext";
import { handleError } from "@/lib/utils";

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
      handleError(err, "Failed to create random room");
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
      className="mb-4"
    >
      <div className="text-center text-sm text-gray-600 mb-4">
        A unique 5-character room ID will be generated for you
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleCreateRoom}
        disabled={isCreating}
        className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center
          ${isCreating ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
      >
        {isCreating ? (
          <>
            <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
            Creating room...
          </>
        ) : (
          <>
            <FiShuffle className="h-5 w-5 mr-2" />
            Create Random Room
          </>
        )}
      </button>
    </motion.div>
  );
}
