import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import CustomRoomOption from "./CustomRoomOption";
import RandomRoomOption from "./RandomRoomOption";

interface RoomCreationOptionsProps {
  onCreateRoom: (roomId: string) => void;
}

export default function RoomCreationOptions({
  onCreateRoom,
}: RoomCreationOptionsProps) {
  const [isCustomRoom, setIsCustomRoom] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={() => setIsCustomRoom(false)}
          className={`px-4 py-2 rounded-md transition-all ${
            !isCustomRoom
              ? "bg-indigo-100 text-indigo-700 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Random Room
        </button>
        <button
          onClick={() => setIsCustomRoom(true)}
          className={`px-4 py-2 rounded-md transition-all ${
            isCustomRoom
              ? "bg-indigo-100 text-indigo-700 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Custom Room
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isCustomRoom ? (
          <CustomRoomOption onCreateRoom={onCreateRoom} />
        ) : (
          <RandomRoomOption onCreateRoom={onCreateRoom} />
        )}
      </AnimatePresence>
    </div>
  );
}
