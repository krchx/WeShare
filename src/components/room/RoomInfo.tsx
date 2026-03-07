import React from "react";

interface RoomInfoProps {
  roomId: string;
  peers: string[];
  userId: string;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({
  roomId,
  peers,
  userId,
}) => {
  return (
    <div className="paper-matte p-5 shrink-0">
      <h3 className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-4 border-b border-[var(--line)] dark:border-[var(--line-dark)] pb-2">
        Diagnostic Info
      </h3>

      <div className="space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center bg-white/35 dark:bg-white/[0.04] p-3 rounded-2xl border border-[var(--line)] dark:border-[var(--line-dark)] gap-4">
          <span className="text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]">
            Your Identity:
          </span>
          <span className="font-bold">{userId}</span>
        </div>
        <div className="flex justify-between items-center bg-white/35 dark:bg-white/[0.04] p-3 rounded-2xl border border-[var(--line)] dark:border-[var(--line-dark)] gap-4">
          <span className="text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]">
            Session ID:
          </span>
          <span className="font-bold">{roomId}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="font-mono text-xs text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-2">
          Connected Peers ({peers.length}):
        </div>
        {peers.length === 0 ? (
          <p className="font-mono text-xs text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] italic bg-white/30 dark:bg-white/[0.03] p-3 rounded-2xl border border-dashed border-[var(--line)] dark:border-[var(--line-dark)]">
            Waiting for peers...
          </p>
        ) : (
          <ul className="space-y-2">
            {peers.map((peer, index) => (
              <li
                key={index}
                className="font-mono text-xs flex items-center bg-green-50/70 dark:bg-green-900/10 p-3 rounded-2xl border border-green-200/80 dark:border-green-900/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
                {peer}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
