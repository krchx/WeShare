import React, { useState } from "react";
import { ShareRoomModal } from "./ShareRoomModal";
import { FaGithub } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { ThemeToggle } from "../ui/theme-toggle";
import { CheckCircle2, LoaderCircle } from "lucide-react";

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

  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4 z-20 relative">
      <div className="paper-matte px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-serif font-black tracking-tight text-[var(--ink)] dark:text-[var(--ink-dark)]">
            WeShare
          </h1>
        </div>

        <div className="flex items-start lg:items-center flex-col">
          <span className="font-mono font-bold text-sm md:text-lg text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] border border-[var(--line)] dark:border-[var(--line-dark)] px-4 py-2 rounded-full bg-white/40 dark:bg-white/[0.04] backdrop-blur-md">
            ID: {roomId}
          </span>
          {connected && !isLoading ? (
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : !connected ? (
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Connecting
            </span>
          ) : (
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] dark:border-[var(--line-dark)] bg-white/35 dark:bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Syncing
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto">
          <ThemeToggle />
          <a
            href="https://github.com/krchx/weshare"
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
            : `https://weshare-live.vercel.app/${roomId}`
        }
      />
    </div>
  );
};
