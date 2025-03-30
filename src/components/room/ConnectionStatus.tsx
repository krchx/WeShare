import React, { useState } from "react";
import { ShareRoomModal } from "./ShareRoomModal";

interface ConnectionStatusProps {
  roomId: string;
  connected: boolean;
  peerCount: number;
  userId: string;
  onShareRoom: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  roomId,
  connected,
  peerCount,
  userId,
  onShareRoom,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const openShareModal = () => {
    setIsShareModalOpen(true);
    onShareRoom();
  };

  return (
    <div className="p-3 flex items-center justify-between">
      <div>
        <img
          className="h-10 md:w-full"
          src="/header-icon.svg"
          alt="header icon"
        />
      </div>
      <div className="flex items-center">
        <span className="font-bold text-sm md:text-2xl text-white">
          Room:{roomId}
        </span>
        {connected ? (
          <span className="ml-2 text-green-600 text-xs md:text-sm">
            {" "}
            ● Connected
          </span>
        ) : (
          <span className="ml-2 text-amber-600 text-xs md:text-sm">
            {" "}
            ● Connecting...
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* {peerCount > 0 && (
          <span className="text-sm">{peerCount} peer(s) connected</span>
        )} */}

        <button
          onClick={openShareModal}
          className="bg-gray-200 hover:bg-gray-300hover:cursor-pointer text-sm py-2 px-3 rounded"
        >
          Share Room
        </button>
      </div>

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomUrl={
          typeof window !== "undefined"
            ? window.location.href
            : `https://weshare.vercel.app/${roomId}`
        }
      />
    </div>
  );
};
