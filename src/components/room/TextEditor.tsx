import React, { useRef } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

interface TextEditorProps {
  text: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  const lineCount = Math.max(1, text.split("\n").length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="paper-matte flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-amber-100/10 dark:from-white/[0.02] dark:to-transparent pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 left-[50px] w-px bg-red-400/24 dark:bg-red-500/20 z-0 pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 left-[54px] w-px bg-red-400/24 dark:bg-red-500/20 z-0 pointer-events-none"></div>

      <div className="px-6 pt-5 pb-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center z-10 border-b border-dashed border-[var(--line)] dark:border-[var(--line-dark)]">
        <div className="hidden sm:block" />
        <h1 className="text-2xl font-serif font-black flex items-center justify-center gap-2 text-center text-[var(--ink)] dark:text-[var(--ink-dark)] sm:col-start-2 sm:justify-self-center">
          Shared Workspace
        </h1>
        <div className="flex justify-center sm:col-start-3 sm:justify-self-end">
          {isLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium tracking-[0.08em] text-sky-800 dark:text-sky-300 uppercase">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Syncing
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-[0.08em] text-emerald-800 dark:text-emerald-300 uppercase">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live Sync
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {isLoading && (
          <div className="absolute inset-0 bg-[var(--paper)]/60 dark:bg-[var(--paper-dark)]/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="paper-card p-4 flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]" />
              <span className="text-sm font-mono font-bold">
                Syncing state...
              </span>
            </div>
          </div>
        )}

        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end pt-[2px] pb-4 px-2 w-[50px] shrink-0 text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] font-mono text-sm select-none overflow-hidden"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span
              key={i}
              className="h-[32px] flex items-center justify-end opacity-60 w-full text-xs"
            >
              {i + 1}
            </span>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          onScroll={handleScroll}
          className="flex-1 pl-6 pr-5 py-0 resize-none outline-none font-mono text-[15px] bg-transparent text-[var(--ink)] dark:text-[var(--ink-dark)] paper-textarea z-10"
          value={text}
          onChange={onChange}
          placeholder="Start typing..."
          disabled={disabled}
          spellCheck="false"
        />
      </div>

      <div className="px-4 py-2 text-xs text-right font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] border-t border-dashed border-[var(--line)] dark:border-[var(--line-dark)] z-10">
        Lines: <span className="font-bold">{lineCount}</span>
      </div>
    </div>
  );
};
