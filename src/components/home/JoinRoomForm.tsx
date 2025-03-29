import { useState } from "react";
import { FirebaseService } from "@/services/firebase";

interface JoinRoomFormProps {
  onJoinRoom: (roomId: string) => void;
}

export default function JoinRoomForm({ onJoinRoom }: JoinRoomFormProps) {
  const [roomId, setRoomId] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    setIsChecking(true);
    try {
      const exists = await FirebaseService.checkRoomExists(roomId);
      setIsChecking(false);

      if (!exists) {
        setError("This room doesn't exist");
        return;
      }

      onJoinRoom(roomId);
    } catch (err) {
      setIsChecking(false);
      setError("Error checking room");
      console.error(err);
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
          className={`absolute right-2 top-2 px-4 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors
            ${
              !roomId.trim() || isChecking
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
        >
          {isChecking ? "Checking..." : "Join"}
        </button>
      </div>
      {error && roomId.trim() && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </form>
  );
}
