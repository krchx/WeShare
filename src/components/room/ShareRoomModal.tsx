import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FaCopy, FaTimes } from "react-icons/fa";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Share Room</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-lg mb-4">
            <QRCodeCanvas value={roomUrl} size={200} />
          </div>

          <p className="text-gray-600 mb-2 text-center">
            Scan this QR code or use the link below to join this room
          </p>

          <div className="flex items-center w-full border rounded p-2 mb-4">
            <input
              type="text"
              value={roomUrl}
              readOnly
              className="flex-1 outline-none text-gray-700"
            />
            <button
              onClick={copyLink}
              className="ml-2 p-2 text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label="Copy link"
            >
              <FaCopy />
            </button>
          </div>

          <span
            className={`text-green-600 transition-opacity duration-300 ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            Link copied!
          </span>
        </div>
      </div>
    </div>
  );
};
