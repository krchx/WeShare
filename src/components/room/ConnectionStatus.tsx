import React, { useState } from "react";
import { ShareRoomModal } from "./ShareRoomModal";

interface ConnectionStatusProps {
  roomId: string;
  connected: boolean;
  isLoading: boolean;
  onShareRoom: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  roomId,
  connected,
  isLoading = false,
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
        <img className="h-10 md:h-16" src="/logo.svg" alt="header icon" />
      </div>
      <div className="flex items-center flex-col">
        <span className="font-bold text-sm md:text-2xl text-gray-400">
          Room:{roomId}
        </span>
        {connected && !isLoading ? (
          <span
            className="ml-2 text-green-600 text-xs md:text-sm flex items-center"
            aria-label="Connected"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600 mr-1.5"></span>
            Connected
          </span>
        ) : !connected ? (
          <span
            className="ml-2 text-amber-600 text-xs md:text-sm flex items-center"
            aria-label="Connecting"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
            Connecting...
          </span>
        ) : (
          <span
            className="ml-2 text-yellow-500 text-xs md:text-sm flex items-center"
            aria-label="Loading Text"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 mr-1.5 animate-pulse"></span>
            Loading Text...
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={openShareModal}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-2 md:font-medium md:text-sm md:py-2 md:px-4 rounded-md transition-colors duration-200 flex items-center space-x-0.5 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span>Share Room</span>
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
