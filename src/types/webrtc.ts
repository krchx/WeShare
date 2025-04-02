export type MessageType =
  | "text-update"
  | "file-metadata"
  | "file-request"
  | "file-response"
  | "file-share"
  | "user-joined"
  | "room-state-request";

export type PeerMessage =
  | { sender: string; type: "text-update"; data: string }
  | { sender: string; type: "file-share"; data: SharedFile }
  | { sender: string; type: "file-metadata"; data: SharedFile }
  | { sender: string; type: "file-request"; data: { id: string } }
  | { sender: string; type: "file-response"; data: SharedFile }
  | { sender: string; type: "user-joined"; data: { userId: string } }
  | { sender: string; type: "room-state-request"; data: string }
  | { sender: string; type: "room-state-response"; data: RoomStateData }
  | { sender: string; type: "others"; data?: never };

export interface RoomStateData {
  text: string;
  files: SharedFile[];
}

export interface PeerData {
  peerId: string;
  joinedAt: number;
}

export interface SharedFile extends FileMetadata {
  content?: string | ArrayBuffer; // Optional - only populated when downloaded
}
export interface FileMetadata {
  id: string; // Unique ID for the file
  name: string;
  type: string;
  size: number;
  sender: string; // User ID of the uploader
}
