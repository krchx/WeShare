import React from "react";

interface ConnectionStatusProps {
  roomId: string;
  connected: boolean;
  peerCount: number;
  userId: string;
  onShareRoom: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  roomId,
  connected,
  peerCount,
  userId,
  onShareRoom,
}) => {
  return (
    <div className="bg-gray-100 p-3 flex items-center justify-between">
      <div>
        <span className="font-bold">Room: {roomId}</span>
        {connected ? (
          <span className="ml-2 text-green-600 text-sm">● Connected</span>
        ) : (
          <span className="ml-2 text-amber-600 text-sm">● Connecting...</span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {peerCount > 0 && (
          <span className="text-sm">{peerCount} peer(s) connected</span>
        )}

        <button
          onClick={onShareRoom}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
        >
          Share Room
        </button>
      </div>
    </div>
  );
};
