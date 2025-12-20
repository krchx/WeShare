import Peer from "peerjs";
import { ConnectionService, ConnectionEventHandler } from "./connection";
import {
  createFileContentResponseMessage,
  createRoomStateResponseMessage,
  createTextUpdateMessage,
} from "./message";
import { FirebaseService } from "./firebase";
import { PeerMessage, FileData } from "@/types/webrtc";
import { generateUserId } from "@/utils/idGenerator";
import { ERROR_CODES, WebRTCError } from "@/lib/errors";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { FILE_SIZE_LIMITS, getArrayBufferFromData } from "@/utils/fileDownload";
import { FileError } from "@/lib/errors";

export class RoomManager
  extends EventEmitter
  implements ConnectionEventHandler
{
  private roomId: string;
  private userId: string;
  private peer: Peer;

  // Services
  private connectionService: ConnectionService;

  // Centralized state object
  private state = {
    text: "",
    isTextLoading: true,
    files: new Map<string, FileData>(),
    connectedPeers: new Set<string>(),
    isConnected: false,
  };

  private isInitialized: boolean = false;
  private connectionStatusInterval: NodeJS.Timeout | null = null;
  private textLoadingTimeout: NodeJS.Timeout | null = null;

  constructor(roomId: string) {
    super();
    this.roomId = roomId;

    // Generate unique user ID for this session
    this.userId = generateUserId();

    try {
      // Initialize peer
      this.peer = new Peer(`${roomId}-${this.userId}`, {
        debug: 2,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });
    } catch {
      throw new WebRTCError(
        "Failed to initialize PeerJS. Please check your network connection or try again later.",
        ERROR_CODES.WEBRTC_CONNECTION_FAILED
      );
    }

    // Initialize services
    this.connectionService = new ConnectionService(this.peer, this);
    this.setupPeerEvents();
  }

  private notifyChange() {
    this.emit("change");
  }

  private handleTextUpdate(text: string): void {
    this.state.text = text;
    this.state.isTextLoading = false;
    this.notifyChange();
  }

  private handleFileMetaData(fileDataArray: FileData[]): void {
    fileDataArray.forEach((fileData) => {
      const enrichedFileData: FileData = {
        ...fileData,
        uploadedByMe: false,
        hasContent: false,
        isDownloading: false,
      };
      this.state.files.set(enrichedFileData.id, enrichedFileData);
    });
    this.notifyChange();
  }

  private async handleFileContentRequest(message: PeerMessage): Promise<void> {
    const requestMessage = message as Extract<
      PeerMessage,
      { type: "file-content-request" }
    >;
    const fileId = requestMessage.data.id;
    const fileData = this.state.files.get(fileId);

    if (fileData && fileData.content instanceof File) {
      const fileContent = await fileData.content.arrayBuffer();
      const responseMessage = createFileContentResponseMessage(
        this.userId,
        fileId,
        fileContent
      );
      const peerId = this.getPeerIdFromUserId(requestMessage.sender);
      if (peerId) {
        this.connectionService.sendToConnection(peerId, responseMessage);
      }
    }
  }

  private handleFileContentResponse(message: PeerMessage): void {
    const responseMessage = message as Extract<
      PeerMessage,
      { type: "file-content-response" }
    >;
    const fileId = responseMessage.data.fileId;
    const existingFile = this.state.files.get(fileId);

    if (existingFile) {
      // Convert the received data to ArrayBuffer if it's not already
      const fileContent = responseMessage.data.fileData;

      const arrayBuffer = getArrayBufferFromData(fileContent);

      const updatedFileData: FileData = {
        ...existingFile,
        hasContent: true,
        isDownloading: false,
        content: arrayBuffer,
      };
      this.state.files.set(fileId, updatedFileData);
      this.notifyChange();

      // Emit file-ready event for auto-download
      this.emit("file-ready", updatedFileData);
    } else {
      console.error(`No existing file found for fileId: ${fileId}`);
    }
  }

  private handleUserJoined(message: PeerMessage): void {
    const joinMessage = message as Extract<
      PeerMessage,
      { type: "user-joined" }
    >;
    const userId = joinMessage.data.userId;
    this.state.connectedPeers.add(userId);
    this.state.isConnected = this.state.connectedPeers.size > 0;
    this.notifyChange();
  }

  private handleStateRequest(message: PeerMessage): void {
    const responseMessage = createRoomStateResponseMessage(
      this.userId,
      this.state.text,
      this.state.files,
      this.state.files // Using same files map for now
    );

    this.connectionService.sendToConnection(message.sender, responseMessage);
  }

  private handleStateResponse(message: PeerMessage): void {
    const stateMessage = message as Extract<
      PeerMessage,
      { type: "room-state-response" }
    >;
    const { text, files } = stateMessage.data;

    if (text) {
      this.handleTextUpdate(text);
    } else {
      this.handleTextUpdate("");
    }

    if (files && files.length > 0) {
      this.handleFileMetaData(files);
    }
  }

  private setupPeerEvents(): void {
    this.peer.on("open", () => {
      this.joinRoom();
    });

    this.peer.on("error", (err) => {
      console.error("Peer error:", err);
    });
  }

  private async joinRoom(): Promise<void> {
    try {
      const peerData = {
        peerId: this.peer.id,
        joinedAt: Date.now(),
      };

      await FirebaseService.registerPeerInRoom(
        this.roomId,
        this.userId,
        peerData
      );

      // Connect to all existing peers
      const existingPeers = await FirebaseService.getAllPeersInRoom(
        this.roomId
      );
      existingPeers.forEach((peer) => {
        if (peer.peerData.peerId !== this.peer.id) {
          this.connectionService.connectToPeer(peer.peerData.peerId);
        }
      });

      // Set up listener for future peers
      FirebaseService.onPeerJoined(this.roomId, (peerId) => {
        if (peerId !== this.peer.id) {
          this.connectionService.connectToPeer(peerId);
        }
      });

      this.isInitialized = true;
      this.state.isConnected = true;
      this.state.isTextLoading = false;
      this.notifyChange();
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  }

  // ConnectionEventHandler implementation
  public onConnectionOpen(peerId: string): void {
    const userId = this.getUserIdFromPeerId(peerId);
    if (userId) {
      this.state.connectedPeers.add(userId);
      this.state.isConnected = this.state.connectedPeers.size > 0;
      this.notifyChange();
    }

    // Send introduction message
    const introMessage: PeerMessage = {
      type: "user-joined",
      data: { userId: this.userId },
      sender: this.userId,
    };
    this.connectionService.sendToConnection(peerId, introMessage);

    // TODO: Implement room state sync logic for new peers
    // Need to determine how to share current state (text, files) to newcomers
  }

  public onConnectionClose(peerId: string): void {
    const userId = this.getUserIdFromPeerId(peerId);
    if (userId) {
      this.state.connectedPeers.delete(userId);
      this.state.isConnected = this.state.connectedPeers.size > 0;
      this.notifyChange();
    }
  }

  public onConnectionError(peerId: string, error: Error): void {
    const userId = this.getUserIdFromPeerId(peerId);
    if (userId) {
      this.state.connectedPeers.delete(userId);
      this.state.isConnected = this.state.connectedPeers.size > 0;
      this.notifyChange();
    }
    console.error(`Connection error with peer ${peerId}:`, error);
  }

  public onMessage(message: PeerMessage): void {
    // this.messageService.handleMessage(message);
    this.handleMessage(message);
  }

  private handleMessage(message: PeerMessage): void {
    switch (message.type) {
      case "text-update":
        this.handleTextUpdate(message.data);
        break;
      case "file-metadata":
        this.handleFileMetaData(message.data);
        break;
      case "file-content-request":
        this.handleFileContentRequest(message);
        break;
      case "file-content-response":
        this.handleFileContentResponse(message);
        break;
      case "user-joined":
        this.handleUserJoined(message);
        break;
      case "room-state-request":
        this.handleStateRequest(message);
        break;
      case "room-state-response":
        this.handleStateResponse(message);
        break;
      default:
        console.warn("Unhandled message type:", message.type);
    }
  }

  // Public methods
  public addFile(file: File): string {
    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      throw new FileError(
        `File "${file.name}" is too large. Maximum size is ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB.`,
        ERROR_CODES.FILE_TOO_LARGE
      );
    }

    const fileId = uuidv4();

    const fileData: FileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      sender: this.userId,
      uploadedByMe: true,
      hasContent: true,
      content: file,
      isDownloading: false,
    };

    this.state.files.set(fileId, fileData);
    this.notifyChange();

    const fileMetaData: FileData = {
      ...fileData,
      uploadedByMe: false,
      hasContent: false,
      content: undefined, // Do not send actual content in metadata
    };

    // Broadcast file metadata to all peers
    const metadataMessage: PeerMessage = {
      type: "file-metadata",
      data: [fileMetaData],
      sender: this.userId,
    };
    this.connectionService.broadcast(metadataMessage);

    return fileId;
  }

  public addFiles(files: File[]): string[] {
    const fileIds: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const fileId = this.addFile(file);
        fileIds.push(fileId);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : `Failed to add file: ${file.name}`
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }

    return fileIds;
  }

  public sendTextUpdate(text: string): void {
    // Update local state first
    this.state.text = text;
    this.state.isTextLoading = false;
    this.notifyChange();

    // Then broadcast to peers
    const message = createTextUpdateMessage(this.userId, text);
    this.connectionService.broadcast(message);
  }

  public requestFile(fileId: string, ownerId: string): void {
    // Mark as downloading in FileData
    const file = this.state.files.get(fileId);
    if (file) {
      this.state.files.set(fileId, {
        ...file,
        isDownloading: true,
      });
      this.notifyChange();
    }

    const message: PeerMessage = {
      type: "file-content-request",
      data: { id: fileId },
      sender: this.userId,
    };
    const peerId = this.getPeerIdFromUserId(ownerId);
    if (peerId) {
      this.connectionService.sendToConnection(peerId, message);
    } else {
      console.error(`Could not find peerId for userId: ${ownerId}`);
    }
  }

  public getConnectedPeers(): string[] {
    return Array.from(this.state.connectedPeers);
  }

  public getUserId(): string {
    return this.userId;
  }

  public isConnected(): boolean {
    return this.isInitialized && !!this.peer.id;
  }

  // State getter methods for EventEmitter pattern
  public getText(): string {
    return this.state.text;
  }

  public isTextLoading(): boolean {
    return this.state.isTextLoading;
  }

  public getFiles(): FileData[] {
    return Array.from(this.state.files.values());
  }

  public getMyFiles(): FileData[] {
    return this.getFiles().filter((f) => f.sender === this.userId);
  }

  public getPeerFiles(): FileData[] {
    return this.getFiles().filter((f) => f.sender !== this.userId);
  }

  public getPeerCount(): number {
    return this.state.connectedPeers.size;
  }

  public disconnect(): void {
    if (this.connectionStatusInterval) {
      clearInterval(this.connectionStatusInterval);
      this.connectionStatusInterval = null;
    }

    if (this.textLoadingTimeout) {
      clearTimeout(this.textLoadingTimeout);
      this.textLoadingTimeout = null;
    }

    this.connectionService.disconnect();
    this.peer.destroy();
  }

  // Helper methods
  private getPeerIdFromUserId(userId: string): string | null {
    const connections = this.connectionService.getConnections();
    return connections.find((peerId) => peerId.endsWith(`-${userId}`)) || null;
  }

  private getUserIdFromPeerId(peerId: string): string | null {
    const lastDashIndex = peerId.lastIndexOf("-");
    return lastDashIndex > 0 ? peerId.substring(lastDashIndex + 1) : null;
  }
}
