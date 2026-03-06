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
  private peerId: string;
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
  private knownRemotePeerIds: Set<string> = new Set();
  private isInitialized: boolean = false;
  private peerIdByUserId: Map<string, string> = new Map();
  private userIdByPeerId: Map<string, string> = new Map();
  private unsubscribePeerJoined: (() => void) | null = null;
  private unsubscribePeerLeft: (() => void) | null = null;
  private getText: () => string;
  private getFiles: () => SharedFile[];
  private connectionStatusInterval: NodeJS.Timeout | null = null;
  private textLoadingTimeout: NodeJS.Timeout | null = null;

  constructor(
    roomId: string,
    getText: () => string,
    getFiles: () => SharedFile[],
    eventHandler: RoomEventHandler,
  ) {
    this.roomId = roomId;
    this.eventHandler = eventHandler;
    this.getText = getText;
    this.getFiles = getFiles;

    // Generate unique user ID for this session
    this.userId = generateUserId();
    this.peerId = `${roomId}-${this.userId}`;
    this.peerIdByUserId.set(this.userId, this.peerId);
    this.userIdByPeerId.set(this.peerId, this.userId);

    try {
      // Initialize peer
      this.peer = new Peer(this.peerId, {
        debug: 2,
        config: {
          iceServers: RoomManager.buildIceServers(),
        },
      });
    } catch {
      throw new WebRTCError(
        "Failed to initialize WebRTC transport. Please check your network connection or try again later.",
        ERROR_CODES.WEBRTC_CONNECTION_FAILED,
      );
    }

    // Initialize services
    this.connectionService = new ConnectionService(this.peer, this, {
      shouldInitiateConnection: (remotePeerId) => this.peerId < remotePeerId,
    });
    this.messageService = new MessageService();
    this.fileService = new FileService(this.userId, this);
    this.leadershipService = new LeadershipService(
      this.userId,
      this.peerId,
      this.roomId,
      Date.now(),
      this,
    );
    this.stateService = new StateService(
      this.userId,
      getText,
      this.getFilesFromService.bind(this),
      this,
    );

    this.setupMessageHandlers();
    this.setupPeerEvents();
  }

  private setupPeerEvents(): void {
    this.peer.on("open", () => {
      this.joinRoom();
    });

    this.peer.on("error", (err) => {
      this.eventHandler.onError(err);
    });
  }

  private setupMessageHandlers(): void {
    // Register message handlers for different message types
    this.messageService.registerHandler("text-update", (message) => {
      this.stateService.handleTextUpdate(
        message as Extract<PeerMessage, { type: "text-update" }>,
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
        requestMessage.data.id,
      );
      if (fileData) {
        const responseMessage = this.fileService.createFileResponseMessage(
          requestMessage.data.id,
          fileData,
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
        responseMessage.data.fileData,
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
        message as Extract<PeerMessage, { type: "room-state-request" }>,
      );
    });

    this.messageService.registerHandler("room-state-response", (message) => {
      this.stateService.handleStateResponse(
        message as Extract<PeerMessage, { type: "room-state-response" }>,
      );
    });
  }

  private async joinRoom(): Promise<void> {
    try {
      this.unsubscribePeerJoined = FirebaseService.onPeerJoined(
        this.roomId,
        (peerId, userId) => {
          this.peerIdByUserId.set(userId, peerId);
          this.userIdByPeerId.set(peerId, userId);

          if (peerId !== this.peerId) {
            this.knownRemotePeerIds.add(peerId);
            this.connectionService.connectToPeer(peerId);
          }
        },
      );

      this.unsubscribePeerLeft = FirebaseService.onPeerLeft(
        this.roomId,
        (peerId, userId) => {
          this.peerIdByUserId.delete(userId);
          this.userIdByPeerId.delete(peerId);
          this.knownRemotePeerIds.delete(peerId);
          this.connectedPeers.delete(peerId);
          this.connectionService.forgetPeer(peerId);
          this.eventHandler.onUserLeft(userId);
          this.eventHandler.onConnectionStatusChanged(
            this.getConnectionStatus(),
          );
        },
      );

      const peerData = {
        peerId: this.peerId,
        joinedAt: Date.now(),
        isLeader: false,
      };

      await FirebaseService.registerPeerInRoom(
        this.roomId,
        this.userId,
        peerData,
      );
      await this.leadershipService.initialize();

      const leader = this.leadershipService.getCurrentLeader();

      if (this.peerId === leader?.peerId) {
        this.eventHandler.onTextUpdated(this.getText());
      }

      this.isInitialized = true;
      this.eventHandler.onConnectionStatusChanged(this.getConnectionStatus());
      this.eventHandler.onConnected();
    } catch (error) {
      this.eventHandler.onError(error as Error);
    }
  }

  // ConnectionEventHandler implementation
  public onConnectionOpen(peerId: string): void {
    this.connectedPeers.add(peerId);
    this.eventHandler.onConnectionStatusChanged(this.getConnectionStatus());

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
      if (leader && leader.peerId !== this.peerId) {
        const stateRequest = this.stateService.createStateRequestMessage();
        this.connectionService.sendToConnection(leader.peerId, stateRequest);
      }
    }
  }

  public onConnectionClose(peerId: string): void {
    this.connectedPeers.delete(peerId);

    this.eventHandler.onConnectionStatusChanged(this.getConnectionStatus());
  }

  public onConnectionError(peerId: string, error: Error): void {
    this.connectedPeers.delete(peerId);
    this.eventHandler.onConnectionStatusChanged(this.getConnectionStatus());

    void this.handleConnectionError(peerId, error);
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
    if (leaderData && leaderData.peerId !== this.peerId) {
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
          file.id,
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
            : `Failed to add file: ${file.name}`,
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

    if (this.unsubscribePeerJoined) {
      this.unsubscribePeerJoined();
      this.unsubscribePeerJoined = null;
    }

    if (this.unsubscribePeerLeft) {
      this.unsubscribePeerLeft();
      this.unsubscribePeerLeft = null;
    }

    this.connectionService.disconnect();
    this.leadershipService.cleanup();
    this.messageService.clear();
    this.fileService.clear();

    void this.cleanupRoomPresence();

    this.peer.destroy();
    this.eventHandler.onConnectionStatusChanged(false);
    this.eventHandler.onDisconnected();
  }

  private async cleanupRoomPresence(): Promise<void> {
    try {
      await FirebaseService.removePeerFromRoom(this.roomId, this.userId);

      if (this.leadershipService.getCurrentLeader()?.userId === this.userId) {
        await FirebaseService.removeRoomLeader(this.roomId);
      } else {
        await FirebaseService.deleteRoomIfEmpty(this.roomId);
      }
    } catch {
      // Firebase onDisconnect still handles the common unload path.
    }
  }

  // Helper methods
  private getFilesFromService(): SharedFile[] {
    return this.fileService.getAllSharedFiles();
  }

  private getPeerIdFromUserId(userId: string): string | null {
    return this.peerIdByUserId.get(userId) ?? null;
  }

  private getUserIdFromPeerId(peerId: string): string | null {
    return this.userIdByPeerId.get(peerId) ?? null;
  }

  private getConnectionStatus(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    if (this.knownRemotePeerIds.size === 0) {
      return true;
    }

    return this.connectedPeers.size > 0;
  }

  private async handleConnectionError(
    peerId: string,
    error: Error,
  ): Promise<void> {
    const userId = this.getUserIdFromPeerId(peerId);

    if (await this.shouldSuppressConnectionError(peerId, userId, error)) {
      return;
    }

    this.eventHandler.onError(
      new WebRTCError(
        `Connection error with peer ${peerId}: ${error.message}`,
        ERROR_CODES.WEBRTC_CONNECTION_ERROR,
      ),
    );
  }

  private async shouldSuppressConnectionError(
    peerId: string,
    userId: string | null,
    error: Error,
  ): Promise<boolean> {
    const normalizedMessage = error.message.toLowerCase();
    const looksLikePeerUnavailableError =
      normalizedMessage.includes("could not connect to peer") ||
      normalizedMessage.includes("peer-unavailable") ||
      normalizedMessage.includes("not found") ||
      normalizedMessage.includes("disconnected");

    if (!looksLikePeerUnavailableError) {
      return false;
    }

    if (!this.knownRemotePeerIds.has(peerId) || !userId) {
      return true;
    }

    try {
      const peerData = await FirebaseService.getPeerInRoom(this.roomId, userId);
      const peerStillPresent = peerData?.peerId === peerId;

      if (!peerStillPresent) {
        this.peerIdByUserId.delete(userId);
        this.userIdByPeerId.delete(peerId);
        this.knownRemotePeerIds.delete(peerId);
        this.connectionService.forgetPeer(peerId);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  private static buildIceServers(): RTCIceServer[] {
    const defaultStunServers = [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ];

    const configuredStunServers = (process.env.NEXT_PUBLIC_STUN_URLS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const stunServers = [
      ...new Set([...defaultStunServers, ...configuredStunServers]),
    ];

    const iceServers: RTCIceServer[] = stunServers.map((urls) => ({ urls }));

    return iceServers;
  }
}
