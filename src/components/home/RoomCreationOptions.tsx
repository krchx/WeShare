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
    <div className="mb-2">
      <div className="inline-flex items-center gap-2 mb-6 p-1 rounded-full border border-[var(--line)] dark:border-[var(--line-dark)] bg-white/30 dark:bg-white/[0.04]">
        <button
          onClick={() => setIsCustomRoom(false)}
          className={`px-4 py-2 rounded-full transition-all font-serif text-sm sm:text-base ${
            !isCustomRoom
              ? "bg-black/90 text-white dark:bg-white dark:text-black shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)]"
          }`}
        >
          Random ID
        </button>
        <button
          onClick={() => setIsCustomRoom(true)}
          className={`px-4 py-2 rounded-full transition-all font-serif text-sm sm:text-base ${
            isCustomRoom
              ? "bg-black/90 text-white dark:bg-white dark:text-black shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)]"
          }`}
        >
          Custom ID
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
