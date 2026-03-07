import React from "react";
import { SharedFile } from "@/types/webrtc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiDownload, FiUploadCloud } from "react-icons/fi";
import { handleError } from "@/lib/utils";

type FileItem = File | SharedFile;

interface FileSharingProps {
  localFiles: FileItem[];
  sharedFiles: SharedFile[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadFile: (file: SharedFile) => void;
  downloadingFiles: Set<string>;
}

export const FileSharing: React.FC<FileSharingProps> = ({
  localFiles,
  sharedFiles,
  onFileUpload,
  onDownloadFile,
  downloadingFiles,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileUpload(e);
      }
    } catch (error) {
      handleError(error, "Failed to process selected files");
    }
  };

  const handleDownload = (file: SharedFile) => {
    try {
      onDownloadFile(file);
    } catch (error) {
      handleError(error, "Failed to download file");
    }
  };

  return (
    <div className="paper-matte p-6 flex flex-col h-full overflow-hidden">
      <h2 className="text-xl font-serif font-black mb-1 text-[var(--ink)] dark:text-[var(--ink-dark)]">
        Files
      </h2>
      <p className="text-xs font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-6 uppercase tracking-[0.2em]">
        P2P file transfer active
      </p>

      <div className="mb-6">
        <label className="paper-btn w-full text-center cursor-pointer flex items-center justify-center p-3 border-dashed border-2 border-[var(--line-strong)] dark:border-[var(--line-dark-strong)]">
          <FiUploadCloud className="mr-2 h-5 w-5" />
          <span className="font-sans text-sm">Select files to share</span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
        </label>
      </div>

      <div className="overflow-y-auto flex-1 pr-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] mb-4 border-b border-[var(--line)] dark:border-[var(--line-dark)] pb-2">
          Shared Items
        </h3>

        {localFiles.length === 0 && sharedFiles.length === 0 ? (
          <div className="text-center py-8 opacity-70">
            <p className="font-mono text-sm text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)]">
              No files shared yet
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {localFiles.map((file) => (
              <li
                key={`local-${file.name}-${file.size}`}
                className="paper-card p-4"
              >
                <div
                  className="text-sm font-medium truncate mb-1 text-[var(--ink)] dark:text-[var(--ink-dark)]"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="text-xs font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] flex justify-between items-center">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span className="text-green-600 dark:text-green-400">
                    You
                  </span>
                </div>
              </li>
            ))}

            {sharedFiles.map((file, index) => (
              <li
                key={`shared-${index}`}
                className="paper-card p-4 border-l-2 border-l-blue-500 dark:border-l-blue-400"
              >
                <div
                  className="text-sm font-medium border-b border-[var(--line)] dark:border-[var(--line-dark)] pb-2 mb-2 truncate text-[var(--ink)] dark:text-[var(--ink-dark)]"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="text-xs font-mono text-[var(--ink-soft)] dark:text-[var(--ink-dark-soft)] flex justify-between items-center mb-2">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>From: {file.sender.substring(0, 4)}</span>
                </div>
                {downloadingFiles.has(file.id) ? (
                  <div className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center">
                    <AiOutlineLoading3Quarters className="mr-1.5 animate-spin" />
                    Downloading...
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-xs font-mono font-bold text-[var(--ink)] dark:text-[var(--ink-dark)] hover:text-blue-600 dark:hover:text-blue-400 hover:cursor-pointer flex items-center transition-colors"
                  >
                    <FiDownload className="mr-1.5" />
                    Download File
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
