import React, { useState } from "react";
import { ShareRoomModal } from "./ShareRoomModal";
import { FaGithub } from "react-icons/fa";
import { ThemeToggle } from "../ui/theme-toggle";
import { siteConfig } from "@/lib/site";

interface HeaderProps {
  roomId: string;
  connected: boolean;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  connected,
  isLoading = false,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const openShareModal = () => {
    setIsShareModalOpen(true);
  };

  const getStatusOutline = () => {
    if (!connected || isLoading) {
      const color = !connected ? "rgb(245 158 11)" : "rgb(14 165 233)"; // amber-500 or sky-500
      return (
        <div
          className="absolute inset-[-2px] rounded-[inherit] overflow-hidden pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <div
            className="absolute w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%] animate-[spin_3s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg, transparent 75%, ${color})`,
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4 z-20 relative">
      <div className="paper-matte px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-serif font-black tracking-tight text-[var(--ink)] dark:text-[var(--ink-dark)]">
            {siteConfig.name}
          </h1>
        </div>

        <div className="relative inline-flex self-start lg:self-auto rounded-full isolation-auto">
          {getStatusOutline()}
          <span
            className={`inline-flex font-mono font-bold text-sm md:text-lg text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] border px-4 py-2 rounded-full relative z-0 transition-all duration-500 overflow-hidden ${!connected || isLoading ? "border-transparent bg-[var(--paper)] dark:bg-[var(--paper-dark)]" : "border-[var(--line)] dark:border-[var(--line-dark)] bg-white/40 dark:bg-white/[0.04] backdrop-blur-md"}`}
          >
            ID: {roomId}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto">
          <ThemeToggle />
          <a
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-btn h-10 w-10 !p-0 flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)] transition-colors"
            title="View on GitHub"
          >
            <FaGithub size={24} />
          </a>
          <button
            onClick={openShareModal}
            className="paper-btn px-5 py-2 text-sm"
          >
            Share
          </button>
        </div>
      </div>

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomUrl={
          typeof window !== "undefined"
            ? window.location.href
            : `${siteConfig.url}/${roomId}`
        }
      />
    </div>
  );
};
