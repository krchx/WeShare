import React from "react";

interface DebugPanelProps {
  peerId: string;
  onConnect: (peerId: string) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  peerId,
  onConnect,
}) => {
  const handleConnect = () => {
    const input = document.querySelector(
      'input[placeholder="Peer ID to connect to"]'
    ) as HTMLInputElement;
    if (input && input.value) {
      onConnect(input.value);
      input.value = "";
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-300">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="text-xs mb-2">Your Peer ID: {peerId}</div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Peer ID to connect to"
          className="flex-1 p-1 text-sm border rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onConnect((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
        <button
          className="text-xs bg-gray-200 px-2 py-1 rounded"
          onClick={handleConnect}
        >
          Connect
        </button>
      </div>
    </div>
  );
};
