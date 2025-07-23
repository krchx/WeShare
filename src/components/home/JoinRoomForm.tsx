import { useState } from "react";
import { FirebaseService } from "@/services/firebase";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiLogIn } from "react-icons/fi";
import { useError } from "@/context/ErrorContext";

interface JoinRoomFormProps {
  onJoinRoom: (roomId: string) => void;
}

export default function JoinRoomForm({ onJoinRoom }: JoinRoomFormProps) {
  const [roomId, setRoomId] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const { showError } = useError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    setIsChecking(true);
    setError("");

    try {
      const exists = await FirebaseService.checkRoomExists(roomId);

      if (!exists) {
        setError("This room doesn't exist");
        return;
      }

      onJoinRoom(roomId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check if room exists";
      showError(errorMessage);
      setError("Error checking room");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setError("");
          }}
          className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!roomId.trim() || isChecking}
          className={`absolute right-2 top-2 px-4 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center
            ${
              !roomId.trim() || isChecking
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
        >
          {isChecking ? (
            <>
              <AiOutlineLoading3Quarters className="animate-spin mr-1 h-4 w-4" />
              Checking...
            </>
          ) : (
            <>
              <FiLogIn className="mr-1 h-4 w-4" />
              Join
            </>
          )}
        </button>
      </div>
      {error && roomId.trim() && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </form>
  );
}
