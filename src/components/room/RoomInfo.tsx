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
    <div className="p-4 border-t border-gray-200">
      <h3 className="font-semibold text-sm uppercase text-stone-800 mb-2">
        Room Information
      </h3>

      <div className="text-sm mb-3">
        <div className="mb-1">
          <span className="font-medium">Your ID: </span>
          <span className="font-mono text-xs bg-gray-50 px-1 py-0.5 rounded">
            {userId}
          </span>
        </div>
        <div>
          <span className="font-medium">Room ID: </span>
          <span className="font-mono text-xs bg-gray-50 px-1 py-0.5 rounded">
            {roomId}
          </span>
        </div>
      </div>

      <div className="text-sm">
        <div className="font-medium mb-1">Connected Peers:</div>
        {peers.length === 0 ? (
          <p className="text-gray-300 italic text-xs">
            No other peers connected
          </p>
        ) : (
          <ul className="space-y-1">
            {peers.map((peer, index) => (
              <li key={index} className="text-xs bg-gray-50 p-1 rounded">
                <span className="font-mono">{peer}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
