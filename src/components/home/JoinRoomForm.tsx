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
      <div className="relative flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Enter secret room ID..."
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setError("");
          }}
          className="paper-input flex-1 text-base sm:text-lg mb-2 sm:mb-0"
        />
        <button
          type="submit"
          disabled={!roomId.trim() || isChecking}
          className={`paper-btn flex items-center justify-center min-w-[140px] px-5 py-3 text-sm sm:text-base
            ${
              !roomId.trim() || isChecking
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
        >
          {isChecking ? (
            <>
              <AiOutlineLoading3Quarters className="animate-spin mr-2 h-4 w-4" />
              Checking
            </>
          ) : (
            <>
              <FiLogIn className="mr-2 h-4 w-4" />
              Join Room
            </>
          )}
        </button>
      </div>
      {error && roomId.trim() && (
        <p className="mt-3 text-sm text-red-500 font-mono flex items-center gap-1 px-1">
          <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
          {error}
        </p>
      )}
    </form>
  );
}
