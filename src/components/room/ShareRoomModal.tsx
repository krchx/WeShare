import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FaCopy, FaTimes, FaCheck } from "react-icons/fa";

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  roomUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/35 dark:bg-black/55 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="paper-panel w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-amber-100/10 dark:from-white/[0.02] dark:to-transparent pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 paper-btn h-10 w-10 !p-0 text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)] transition-colors"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>

        <h3 className="text-2xl font-serif font-black mb-6 text-center relative z-10 text-[var(--ink)] dark:text-[var(--ink-dark)]">
          Share Session
        </h3>

        <div className="flex flex-col items-center relative z-10">
          <div className="p-4 bg-white/80 dark:bg-white rounded-[24px] border border-[var(--line)] shadow-sm mb-6">
            <QRCodeCanvas value={roomUrl} size={180} />
          </div>

          <p className="font-mono text-sm text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-4 text-center leading-relaxed">
            Scan to join instantly, or copy the direct link below.
          </p>

          <div className="flex items-center w-full gap-2 mb-2">
            <input
              type="text"
              value={roomUrl}
              readOnly
              className="paper-input flex-1 text-sm"
            />
            <button
              onClick={copyLink}
              className="paper-btn px-4 py-2 flex items-center justify-center shrink-0 min-w-[100px]"
              aria-label="Copy link"
            >
              {copied ? (
                <>
                  <FaCheck className="mr-2" /> Copied
                </>
              ) : (
                <>
                  <FaCopy className="mr-2" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
