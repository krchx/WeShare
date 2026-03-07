import React, { useRef } from "react";

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
  const loadingPulseColor = "rgb(180 83 9)";
  const lineCount = Math.max(1, text.split("\n").length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const getStatusOutline = () => {
    if (isLoading) {
      return (
        <div
          className="absolute inset-[-2px] rounded-[inherit] overflow-hidden pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <div
            className="absolute w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%] animate-[spin_3s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg, transparent 75%, ${loadingPulseColor})`,
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-500 isolation-auto rounded-[32px] border border-transparent shadow-[var(--shadow-elevated)] dark:shadow-[var(--shadow-elevated-dark)]`}
    >
      {getStatusOutline()}
      <div className="absolute inset-[1px] bg-[var(--paper)] dark:bg-[var(--paper-dark)] rounded-[calc(inherit-1px)] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-amber-100/10 dark:from-white/[0.02] dark:to-transparent pointer-events-none z-0 rounded-[32px]"></div>
      <div className="absolute inset-0 border border-[var(--line)] dark:border-[var(--line-dark)] rounded-[32px] pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 bottom-0 left-[54px] w-px bg-red-400/24 dark:bg-red-500/20 z-0 pointer-events-none rounded-l-[31px]"></div>

      <div className="px-6 pt-5 pb-4 flex items-center justify-center z-10 border-b border-dashed border-[var(--line)] dark:border-[var(--line-dark)]">
        <h1 className="text-2xl font-serif font-black flex items-center justify-center gap-2 text-center text-[var(--ink)] dark:text-[var(--ink-dark)]">
          Shared Workspace
        </h1>
      </div>

      <div
        className={`flex flex-1 overflow-hidden relative z-10 transition-all duration-300 ${
          isLoading ? "blur-[1.5px] opacity-85" : "blur-0 opacity-100"
        }`}
      >
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

      {isLoading && (
        <div className="absolute inset-0 rounded-[32px] bg-amber-700/5 dark:bg-amber-200/5 pointer-events-none z-10" />
      )}

      <div className="px-4 py-2 text-xs text-right font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] border-t border-dashed border-[var(--line)] dark:border-[var(--line-dark)] z-10">
        Lines: <span className="font-bold">{lineCount}</span>
      </div>
    </div>
  );
};
