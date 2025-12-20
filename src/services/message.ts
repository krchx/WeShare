import { PeerMessage, FileData } from "@/types/webrtc";

export function createTextUpdateMessage(
  userId: string,
  text: string
): PeerMessage {
  return {
    type: "text-update",
    data: text,
    sender: userId,
  };
}

export function createRoomStateRequestMessage(userId: string): PeerMessage {
  return {
    type: "room-state-request",
    data: "",
    sender: userId,
  };
}

export function createFileContentResponseMessage(
  userId: string,
  fileId: string,
  fileData: ArrayBuffer
): PeerMessage {
  return {
    type: "file-content-response",
    data: { fileId, fileData },
    sender: userId,
  };
}

export function createRoomStateResponseMessage(
  userId: string,
  text: string,
  sharedFiles: Map<string, FileData>,
  localFiles: Map<string, FileData>
): PeerMessage {
  return {
    type: "room-state-response",
    data: {
      text,
      files: [...sharedFiles.values(), ...localFiles.values()],
    },
    sender: userId,
  };
}
