import { SharedFile, PeerMessage, RoomStateData } from "@/types/webrtc";

export interface StateEventHandler {
  onTextUpdated(text: string): void;
  onStateRequested(requesterId: string): void;
}

export class StateService {
  private userId: string;
  private getText: () => string;
  private getFiles: () => SharedFile[];
  private eventHandler: StateEventHandler;

  constructor(
    userId: string,
    getText: () => string,
    getFiles: () => SharedFile[],
    eventHandler: StateEventHandler
  ) {
    this.userId = userId;
    this.getText = getText;
    this.getFiles = getFiles;
    this.eventHandler = eventHandler;
  }

  public handleTextUpdate(
    message: Extract<PeerMessage, { type: "text-update" }>
  ): void {
    if (message.sender !== this.userId) {
      this.eventHandler.onTextUpdated(message.data);
    }
  }

  public handleStateRequest(
    message: Extract<PeerMessage, { type: "room-state-request" }>
  ): void {
    this.eventHandler.onStateRequested(message.sender);
  }

  public handleStateResponse(
    message: Extract<PeerMessage, { type: "room-state-response" }>
  ): void {
    const { text } = message.data;

    // Always update text, even if it's empty - this ensures proper sync
    if (text !== undefined && text !== null) {
      this.eventHandler.onTextUpdated(text);
    }

    // Files metadata will be handled by individual file-metadata messages
    // The room state response just triggers the process
  }

  public createTextUpdateMessage(text: string): PeerMessage {
    return {
      type: "text-update",
      data: text,
      sender: this.userId,
    };
  }

  public createStateRequestMessage(): PeerMessage {
    return {
      type: "room-state-request",
      data: "",
      sender: this.userId,
    };
  }

  public createStateResponseMessage(): PeerMessage {
    const roomState: RoomStateData = {
      text: this.getText(),
      files: this.getFiles(),
    };

    return {
      type: "room-state-response",
      data: roomState,
      sender: this.userId,
    };
  }
}
