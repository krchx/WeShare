import { useState } from "react";
import { motion } from "framer-motion";
import { FirebaseService } from "@/services/firebase";

interface RandomRoomOptionProps {
  onCreateRoom: (roomId: string) => void;
}

export default function RandomRoomOption({
  onCreateRoom,
}: RandomRoomOptionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    let newRoomId;
    let isUnique = false;

    setIsCreating(true);
    try {
      // Try to find a unique room ID
      while (!isUnique) {
        newRoomId = Math.random().toString(36).substring(2, 7);
        const exists = await FirebaseService.checkRoomExists(newRoomId);
        isUnique = !exists;
      }

      setIsCreating(false);
      if (newRoomId) {
        onCreateRoom(newRoomId);
      } else {
        setError("Failed to generate a valid room ID");
      }
    } catch (err) {
      setIsCreating(false);
      setError("Error creating room");
      console.error(err);
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
            Create Random Room
          </>
        )}
      </button>
    </motion.div>
  );
}
