import { motion } from "framer-motion";
import { useRoomCreation } from "@/hooks/useRoomCreation";
import { AiOutlineLoading3Quarters, AiOutlinePlus } from "react-icons/ai";

interface CustomRoomOptionProps {
  onCreateRoom: (roomId: string) => void;
}

export default function CustomRoomOption({
  onCreateRoom,
}: CustomRoomOptionProps) {
  const { roomId, setRoomId, isChecking, error, isAvailable, createRoom } =
    useRoomCreation(onCreateRoom);

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-4 pt-2"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Custom ID (3-10 chars)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.trim())}
          className={`paper-input w-full text-base sm:text-lg ${
            isAvailable === true
              ? "!border-green-500"
              : isAvailable === false
                ? "!border-red-500"
                : ""
          }`}
          maxLength={10}
        />
        {isChecking && (
          <div className="absolute right-2 bottom-2 px-1 text-gray-500 text-sm flex items-center">
            <AiOutlineLoading3Quarters className="animate-spin h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-h-6 mt-3 text-sm font-mono px-1">
        {roomId && (
          <>
            {isAvailable === true && (
              <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500 inline-block"></span>
                Available
              </p>
            )}
            {isAvailable === false && (
              <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                Taken
              </p>
            )}
            {error && (
              <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                {error}
              </p>
            )}
            {!error && !isAvailable && roomId && (
              <p className="text-gray-500">Alphanumeric characters only</p>
            )}
          </>
        )}
      </div>

      <button
        onClick={createRoom}
        disabled={!roomId.trim() || isAvailable === false || isChecking}
        className={`paper-btn w-full mt-4 py-3 px-4 flex items-center justify-center
          ${
            !roomId.trim() || isAvailable === false || isChecking
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100"
          }`}
      >
        {isChecking ? (
          <>
            <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
            Creating...
          </>
        ) : (
          <>
            <AiOutlinePlus className="h-5 w-5 mr-2" />
            Create
          </>
        )}
      </button>
    </motion.div>
  );
}
