import React from "react";
import { SharedFile } from "@/types/webrtc";

interface FileSharingProps {
  localFiles: File[];
  sharedFiles: SharedFile[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadFile: (file: SharedFile) => void;
}

export const FileSharing: React.FC<FileSharingProps> = ({
  localFiles,
  sharedFiles,
  onFileUpload,
  onDownloadFile,
}) => {
  return (
    <div className="p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-2">Files</h2>
      <p className="text-sm text-gray-100 mb-3">
        Files are shared directly with other users via WebRTC.
      </p>

      <div className="mb-4">
        <label className="block mb-2">
          <span className="sr-only">Choose files</span>
          <input
            type="file"
            className="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-gray-200 hover:file:bg-blue-800 hover:cursor-pointer"
            onChange={onFileUpload}
            multiple
          />
        </label>
      </div>

      <div className="overflow-y-auto max-h-60">
        <h3 className="font-semibold text-sm uppercase text-gray-800 mb-2">
          Shared Files
        </h3>

        {localFiles.length === 0 && sharedFiles.length === 0 ? (
          <p className="text-gray-300 italic text-sm">No files shared yet</p>
        ) : (
          <ul className="space-y-2">
            {localFiles.map((file, index) => (
              <li key={`local-${index}`} className="p-2 bg-blue-200 rounded">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-700 flex justify-between">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>You shared this</span>
                </div>
              </li>
            ))}

            {sharedFiles.map((file, index) => (
              <li key={`shared-${index}`} className="p-2 bg-green-50 rounded">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>From {file.sender.substring(0, 6)}</span>
                </div>
                <button
                  onClick={() => onDownloadFile(file)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:cursor-pointer"
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
