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
      className="mb-4"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Enter custom room name (3-10 chars)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.trim())}
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
            <AiOutlineLoading3Quarters className="animate-spin mr-2 h-4 w-4 text-indigo-500" />
            Checking...
          </div>
        )}
      </div>
      {roomId && (
        <div className="mt-2 text-sm">
          {isAvailable === true && (
            <p className="text-green-600">✓ This room name is available</p>
          )}
          {isAvailable === false && (
            <p className="text-red-600">✗ This room name is already taken</p>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {!error && !isAvailable && roomId && (
            <p className="text-gray-500">
              Room name must be 3-10 alphanumeric characters
            </p>
          )}
        </div>
      )}

      <button
        onClick={createRoom}
        disabled={!roomId.trim() || isAvailable === false || isChecking}
        className={`w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center
          ${
            !roomId.trim() || isAvailable === false || isChecking
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100"
          }`}
      >
        {isChecking ? (
          <>
            <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
            Creating room...
          </>
        ) : (
          <>
            <AiOutlinePlus className="h-5 w-5 mr-2" />
            Create Custom Room
          </>
        )}
      </button>
    </motion.div>
  );
}
