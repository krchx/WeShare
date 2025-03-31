export type MessageType =
  | "text-update"
  | "file-share"
  | "user-joined"
  | "editor-text";

export interface PeerMessage {
  type: MessageType;
  data: any;
  sender: string;
}

export interface PeerData {
  peerId: string;
  joinedAt: number;
}

export interface SharedFile {
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  sender: string;
}
