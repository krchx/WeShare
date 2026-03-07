"use client";
import { useRouter } from "next/navigation";
import JoinRoomForm from "@/components/home/JoinRoomForm";
import RoomCreationOptions from "@/components/home/RoomCreationOptions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/lib/site";
import { FaGithub } from "react-icons/fa";

export default function Home() {
  const router = useRouter();

  const handleJoinRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  const handleCreateRoom = (roomId: string) => {
    router.push(`/${roomId}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-5 py-8 sm:px-10 sm:py-12 sm:justify-center relative overflow-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[-4rem] h-72 w-72 rounded-full bg-white/30 blur-3xl dark:bg-stone-200/5" />
        <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-100/5" />
      </div>

      <div className="relative self-end mb-8 flex items-center gap-3 z-20 rounded-full px-2 py-2 paper-card sm:absolute sm:top-6 sm:right-6 sm:mb-0">
        <ThemeToggle />
        <a
          href={siteConfig.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 w-9 flex items-center justify-center rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)] transition-colors"
          title="View on GitHub"
        >
          <FaGithub size={24} />
        </a>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] dark:border-[var(--line-dark)] bg-white/30 dark:bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-5">
            Soft matte workspace
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-[-0.05em] mb-4 text-[var(--ink)] dark:text-[var(--ink-dark)]">
            {siteConfig.name}
          </h1>
          <p className="text-base md:text-xl font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] max-w-2xl mx-auto leading-relaxed">
            {siteConfig.shortDescription} Pure ephemeral connection.
          </p>
        </div>

        <div className="paper-matte p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-amber-100/10 dark:from-white/[0.03] dark:to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-[var(--ink)] dark:text-[var(--ink-dark)]">
              <span className="text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] font-mono text-base font-normal opacity-70">
                01.
              </span>
              Join Existing Session
            </h2>
            <JoinRoomForm onJoinRoom={handleJoinRoom} />

            <div className="my-10 border-t border-dashed border-[var(--line)] dark:border-[var(--line-dark)] relative">
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--paper)]/90 dark:bg-[var(--paper-dark)]/90 px-4 font-mono text-sm text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]">
                OR
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-6 flex items-center gap-3 text-[var(--ink)] dark:text-[var(--ink-dark)]">
              <span className="text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] font-mono text-base font-normal opacity-70">
                02.
              </span>
              Start New Session
            </h2>
            <RoomCreationOptions onCreateRoom={handleCreateRoom} />
          </div>
        </div>

        <div className="mt-8 text-center font-mono text-xs sm:text-sm text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] flex flex-col items-center gap-2 tracking-[0.18em] uppercase">
          <p>End-to-end WebRTC</p>
        </div>
      </div>
    </main>
  );
}
