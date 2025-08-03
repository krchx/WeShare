import Peer from "peerjs";
import { ConnectionService, ConnectionEventHandler } from "./connection";
import { MessageService } from "./message";
import { FileService, FileEventHandler } from "./file";
import { LeadershipService, LeadershipEventHandler } from "./leadership";
import { StateService, StateEventHandler } from "./state";
import { FirebaseService } from "./firebase";
import { PeerMessage, SharedFile, RoomLeaderData } from "@/types/webrtc";
import { generateUserId } from "@/utils/idGenerator";
import { ERROR_CODES, WebRTCError } from "@/lib/errors";

export interface RoomEventHandler {
  onUserJoined(userId: string): void;
  onUserLeft(userId: string): void;
  onConnected(): void;
  onDisconnected(): void;
  onError(error: Error): void;
  onTextUpdated(text: string): void;
  onFileAdded(file: SharedFile): void;
  onFileRemoved(fileId: string): void;
  onFileReceived(fileId: string, fileData: ArrayBuffer): void;
  onLeaderChanged(leader: RoomLeaderData | null): void;
  onConnectionStatusChanged(connected: boolean): void;
}

export class RoomManager
  implements
    ConnectionEventHandler,
    FileEventHandler,
    LeadershipEventHandler,
    StateEventHandler
{
  private roomId: string;
  private userId: string;
  private peer: Peer;
  private eventHandler: RoomEventHandler;

  // Services
  private connectionService: ConnectionService;
  private messageService: MessageService;
  private fileService: FileService;
  private leadershipService: LeadershipService;
  private stateService: StateService;

  // State
  private connectedPeers: Set<string> = new Set();
  private isInitialized: boolean = false;
  private getText: () => string;
  private getFiles: () => SharedFile[];
  private connectionStatusInterval: NodeJS.Timeout | null = null;
  private textLoadingTimeout: NodeJS.Timeout | null = null;

  constructor(
    roomId: string,
    getText: () => string,
    getFiles: () => SharedFile[],
    eventHandler: RoomEventHandler
  ) {
    this.roomId = roomId;
    this.eventHandler = eventHandler;
    this.getText = getText;
    this.getFiles = getFiles;

    // Get or generate user ID
    // const storedUserId = sessionStorage.getItem("weshare-userId");
    this.userId = generateUserId();
    // if (!storedUserId) {
    //   sessionStorage.setItem("weshare-userId", this.userId);
    // }

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
    this.messageService = new MessageService();
    this.fileService = new FileService(this.userId, this);
    this.leadershipService = new LeadershipService(
      this.userId,
      this.peer.id,
      this.roomId,
      Date.now(),
      this
    );
    this.stateService = new StateService(
      this.userId,
      getText,
      this.getFilesFromService.bind(this),
      this
    );

    this.setupMessageHandlers();
    this.setupPeerEvents();
    // this.startConnectionStatusMonitoring();
  }

  private setupPeerEvents(): void {
    this.peer.on("open", () => {
      this.joinRoom();
    });

    this.peer.on("error", (err) => {
      this.eventHandler.onError(err);
    });
  }

  private startConnectionStatusMonitoring(): void {
    this.connectionStatusInterval = setInterval(() => {
      const wasConnected = this.isInitialized && !!this.peer.id;
      const isConnected = this.isConnected();
      if (wasConnected !== isConnected) {
        this.eventHandler.onConnectionStatusChanged(isConnected);
      }
    }, 1000);
  }

  private setupMessageHandlers(): void {
    // Register message handlers for different message types
    this.messageService.registerHandler("text-update", (message) => {
      this.stateService.handleTextUpdate(
        message as Extract<PeerMessage, { type: "text-update" }>
      );
    });

    this.messageService.registerHandler("file-metadata", (message) => {
      const fileMessage = message as Extract<
        PeerMessage,
        { type: "file-metadata" }
      >;
      this.fileService.addSharedFile(fileMessage.data);
    });

    this.messageService.registerHandler("file-request", async (message) => {
      const requestMessage = message as Extract<
        PeerMessage,
        { type: "file-request" }
      >;
      const fileData = await this.fileService.handleFileRequest(
        requestMessage.data.id
      );
      if (fileData) {
        const responseMessage = this.fileService.createFileResponseMessage(
          requestMessage.data.id,
          fileData
        );
        const peerId = this.getPeerIdFromUserId(message.sender);
        if (peerId) {
          this.connectionService.sendToConnection(peerId, responseMessage);
        }
      }
    });

    this.messageService.registerHandler("file-response", (message) => {
      const responseMessage = message as Extract<
        PeerMessage,
        { type: "file-response" }
      >;
      this.fileService.handleFileResponse(
        responseMessage.data.fileId,
        responseMessage.data.fileData
      );
    });

    this.messageService.registerHandler("user-joined", (message) => {
      const joinMessage = message as Extract<
        PeerMessage,
        { type: "user-joined" }
      >;
      this.eventHandler.onUserJoined(joinMessage.data.userId);
    });

    this.messageService.registerHandler("room-state-request", (message) => {
      this.stateService.handleStateRequest(
        message as Extract<PeerMessage, { type: "room-state-request" }>
      );
    });

    this.messageService.registerHandler("room-state-response", (message) => {
      this.stateService.handleStateResponse(
        message as Extract<PeerMessage, { type: "room-state-response" }>
      );
    });
  }

  private async joinRoom(): Promise<void> {
    try {
      const peerData = {
        peerId: this.peer.id,
        joinedAt: Date.now(),
        isLeader: false,
      };

      await FirebaseService.registerPeerInRoom(
        this.roomId,
        this.userId,
        peerData
      );
      await this.leadershipService.initialize();

      const leader = this.leadershipService.getCurrentLeader();
      if (leader && leader.peerId !== this.peer.id) {
        // Connect to the leader if one exists
        this.connectionService.connectToPeer(leader.peerId);
      } else {
        // Otherwise, connect to all peers
        FirebaseService.onPeerJoined(this.roomId, (peerId) => {
          if (peerId !== this.peer.id) {
            this.connectionService.connectToPeer(peerId);
          }
        });
      }

      if (this.peer.id === leader?.peerId) {
        this.eventHandler.onTextUpdated(this.getText());
      }

      this.isInitialized = true;
      this.eventHandler.onConnected();
    } catch (error) {
      this.eventHandler.onError(error as Error);
    }
  }

  // ConnectionEventHandler implementation
  public onConnectionOpen(peerId: string): void {
    this.connectedPeers.add(peerId);

    // Send introduction message
    const introMessage: PeerMessage = {
      type: "user-joined",
      data: { userId: this.userId },
      sender: this.userId,
    };
    this.connectionService.sendToConnection(peerId, introMessage);

    // Request room state if we are not the leader and don't have the state
    if (!this.leadershipService.getIsLeader()) {
      const leader = this.leadershipService.getCurrentLeader();
      if (leader && leader.peerId !== this.peer.id) {
        const stateRequest = this.stateService.createStateRequestMessage();
        this.connectionService.sendToConnection(leader.peerId, stateRequest);
      }
    }
  }

  public onConnectionClose(peerId: string): void {
    this.connectedPeers.delete(peerId);
    const userId = this.getUserIdFromPeerId(peerId);
    if (userId) {
      this.eventHandler.onUserLeft(userId);
    }
  }

  public onConnectionError(peerId: string, error: Error): void {
    this.connectedPeers.delete(peerId);
    throw new WebRTCError(
      `Connection error with peer ${peerId}: ${error.message}`,
      ERROR_CODES.WEBRTC_CONNECTION_ERROR
    );
  }

  public onMessage(message: PeerMessage): void {
    this.messageService.handleMessage(message);
  }

  // FileEventHandler implementation
  public onFileAdded(file: SharedFile): void {
    // Broadcast file metadata to all peers
    const metadataMessage = this.fileService.createFileMetadataMessage(file.id);
    if (metadataMessage) {
      this.connectionService.broadcast(metadataMessage);
    }

    if (file.sender === this.userId) {
      // Don't add our own files to sharedFiles, they are already in localFiles
      return;
    }
    this.eventHandler.onFileAdded(file);
  }

  public onFileRemoved(fileId: string): void {
    this.eventHandler.onFileRemoved(fileId);
  }

  public onFileReceived(fileId: string, fileData: ArrayBuffer): void {
    this.eventHandler.onFileReceived(fileId, fileData);
  }

  // LeadershipEventHandler implementation
  public onBecameLeader(leaderData: RoomLeaderData): void {
    this.eventHandler.onLeaderChanged(leaderData);

    // Announce leadership to all connected peers
    const announcement =
      this.leadershipService.createLeaderAnnouncementMessage();
    this.connectionService.broadcast(announcement);
  }

  public onLeaderChanged(leaderData: RoomLeaderData | null): void {
    this.eventHandler.onLeaderChanged(leaderData);
    if (leaderData && leaderData.peerId !== this.peer.id) {
      if (!this.connectionService.isConnectedTo(leaderData.peerId)) {
        this.connectionService.connectToPeer(leaderData.peerId);
      }
    }
  }

  public onSteppedDown(): void {
    this.eventHandler.onLeaderChanged(null);
  }

  public onError(message: string, error: unknown): void {
    // Convert to Error type for the event handler
    const err = error instanceof Error ? error : new Error(message);
    this.eventHandler.onError(err);
  }

  // StateEventHandler implementation
  public onTextUpdated(text: string): void {
    this.eventHandler.onTextUpdated(text);
  }

  public onStateRequested(requesterId: string): void {
    const stateResponse = this.stateService.createStateResponseMessage();
    const peerId = this.getPeerIdFromUserId(requesterId);
    if (peerId) {
      this.connectionService.sendToConnection(peerId, stateResponse);

      // Also send all file metadata to ensure complete state sync
      const existingFiles = this.fileService.getAllSharedFiles();
      existingFiles.forEach((file) => {
        const metadataMessage = this.fileService.createFileMetadataMessage(
          file.id
        );
        if (metadataMessage) {
          this.connectionService.sendToConnection(peerId, metadataMessage);
        }
      });
    }
  }

  // Public methods
  public addFile(file: File): string {
    return this.fileService.addFile(file);
  }

  public addFiles(files: File[]): string[] {
    const fileIds: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const fileId = this.fileService.addFile(file);
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
    const message = this.stateService.createTextUpdateMessage(text);
    this.connectionService.broadcast(message);
  }

  public requestFile(fileId: string, ownerId: string): void {
    const message = this.fileService.createFileRequestMessage(fileId);
    const peerId = this.getPeerIdFromUserId(ownerId);
    if (peerId) {
      this.connectionService.sendToConnection(peerId, message);
    }
  }

  public getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers);
  }

  public getUserId(): string {
    return this.userId;
  }

  public isConnected(): boolean {
    return this.isInitialized && !!this.peer.id;
  }

  public getIsLeader(): boolean {
    return this.leadershipService.getIsLeader();
  }

  public getCurrentLeader(): RoomLeaderData | null {
    return this.leadershipService.getCurrentLeader();
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

    if (this.leadershipService.getIsLeader()) {
      this.leadershipService.stepDown();
    }

    FirebaseService.removePeerFromRoom(this.roomId, this.userId);
    this.connectionService.disconnect();
    this.messageService.clear();
    this.fileService.clear();
    this.peer.destroy();
  }

  // Helper methods
  private getFilesFromService(): SharedFile[] {
    return this.fileService.getAllSharedFiles();
  }

  private getPeerIdFromUserId(userId: string): string | null {
    const connections = this.connectionService.getConnections();
    return connections.find((peerId) => peerId.endsWith(`-${userId}`)) || null;
  }

  private getUserIdFromPeerId(peerId: string): string | null {
    const lastDashIndex = peerId.lastIndexOf("-");
    return lastDashIndex > 0 ? peerId.substring(lastDashIndex + 1) : null;
  }
}
