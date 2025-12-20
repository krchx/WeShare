export type MessageType =
  | "text-update"
  | "file-metadata"
  | "file-content-request"
  | "file-content-response"
  | "user-joined"
  | "room-state-request"
  | "room-state-response"
  | "leader-election"
  | "leader-announcement"
  | "leader-handover";

export type PeerMessage =
  | { sender: string; type: "text-update"; data: string }
  | { sender: string; type: "file-metadata"; data: FileData[] }
  | { sender: string; type: "file-content-request"; data: { id: string } }
  | {
      sender: string;
      type: "file-content-response";
      data: { fileData: ArrayBuffer; fileId: string };
    }
  | { sender: string; type: "user-joined"; data: { userId: string } }
  | { sender: string; type: "room-state-request"; data: string }
  | { sender: string; type: "room-state-response"; data: RoomStateData }
  | { sender: string; type: "leader-election"; data: LeaderElectionData }
  | { sender: string; type: "leader-announcement"; data: RoomLeaderData }
  | { sender: string; type: "leader-handover"; data: RoomLeaderData }
  | { sender: string; type: "others"; data?: never };

export interface RoomStateData {
  text: string;
  files: FileData[];
}

export interface PeerData {
  peerId: string;
  joinedAt: number;
  isLeader?: boolean;
}

export interface RoomLeaderData {
  userId: string;
  peerId: string;
  joinedAt: number;
}

export interface LeaderElectionData {
  candidateId: string;
  joinedAt: number;
}

export interface FileData {
  id: string; // Unique ID for the file
  name: string;
  type: string;
  size: number;
  sender: string; // User ID of the uploader
  uploadedByMe?: boolean; // Indicates if the file was uploaded by the current user
  isDownloading?: boolean; // Indicates if the file is currently being downloaded
  hasContent?: boolean; // Indicates if the file content is available
  content?: File | ArrayBuffer; // File object for uploaded files, ArrayBuffer for downloaded files
}
