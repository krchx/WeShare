import React, { useState } from "react";
import { ShareRoomModal } from "./ShareRoomModal";
import { FaGithub } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface HeaderProps {
  roomId: string;
  connected: boolean;
  isLoading: boolean;
  onShareRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
            <AiOutlineLoading3Quarters className="mr-1.5 animate-spin h-2.5 w-2.5" />
            Connecting...
          </span>
        ) : (
          <span
            className="ml-2 text-yellow-500 text-xs md:text-sm flex items-center"
            aria-label="Loading Text"
          >
            <AiOutlineLoading3Quarters className="mr-1.5 animate-spin h-2.5 w-2.5" />
            Loading Text...
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <a
          href="https://github.com/krchx/weshare"
          target="_blank"
          rel="noopener noreferrer"
          className="items-center flex px-2 md:px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors shadow-sm duration-200"
          aria-label="View source on GitHub"
        >
          <FaGithub className="w-7 h-7 md:mr-2" />
          <span className="hidden md:inline">GitHub Repo</span>
        </a>
        <button
          onClick={openShareModal}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-2 md:font-medium md:text-sm md:py-2 md:px-4 rounded-md transition-colors duration-200 flex items-center space-x-0.5 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="hidden md:inline">Share Room</span>
        </button>
      </div>

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomUrl={
          typeof window !== "undefined"
            ? window.location.href
            : `https://weshare-live.vercel.app/${roomId}`
        }
      />
    </div>
  );
};
