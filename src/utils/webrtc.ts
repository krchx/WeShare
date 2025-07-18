import Peer from "peerjs";
import { PeerConnectionManager } from "@/services/peer-connection";
import { FirebaseService } from "@/services/firebase";
import { PeerMessage, SharedFile, RoomLeaderData } from "@/types/webrtc";
import { generateUserId } from "./idGenerator";
import { v4 as uuidv4 } from "uuid";
import { WebRTCError, FirebaseError, ERROR_CODES } from "@/lib/errors";

// WebRTCService class definition
export class WebRTCService {
  // Private properties
  private peer: Peer;
  private connectionManager: PeerConnectionManager;
  private userId: string;
  private roomId: string;
  private messageListeners: ((message: PeerMessage) => void)[] = [];
  private localFileStore: Map<string, File> = new Map();
  private getEditorText: () => string;
  private getSharedFiles: () => SharedFile[];
  private joinedAt: number;

  // Leader election properties
  private isLeader: boolean = false;
  private currentLeader: RoomLeaderData | null = null;
  private leaderElectionInProgress: boolean = false;

  /**
   * Constructor: Initializes the WebRTC service for a specific room
   * @param roomId - The ID of the room to join
   */
  constructor(
    roomId: string,
    getEditorText: () => string,
    getSharedFiles: () => SharedFile[]
  ) {
    // Check session storage for a user ID
    const storedUserId = sessionStorage.getItem("weshare-userId");
    if (storedUserId) {
      this.userId = storedUserId; // Use the stored user ID
    } else {
      this.userId = generateUserId(); // Generate a new user ID
      sessionStorage.setItem("weshare-userId", this.userId); // Store it in session storage
    }

    this.roomId = roomId;
    this.joinedAt = Date.now();

    // Create a new peer with a unique ID
    this.peer = new Peer(`${roomId}-${this.userId}`, {
      debug: 2,

      config: {
        iceServers: [
          // STUN servers
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      },
    });

    this.getEditorText = getEditorText;
    this.getSharedFiles = getSharedFiles;

    // Initialize the connection manager
    this.connectionManager = new PeerConnectionManager(this.peer, this.userId);

    // Register message handler
    this.connectionManager.onMessage(this.handleMessage.bind(this));

    // Set up peer event handlers
    this.setupPeerEvents();
  }

  /**
   * Set up event handlers for the Peer instance
   */
  private setupPeerEvents(): void {
    this.peer.on("open", () => {
      try {
        this.joinRoom(); // Automatically join the room when the peer is ready
      } catch {
        throw new WebRTCError(
          "Failed to join room after connection established",
          ERROR_CODES.WEBRTC_CONNECTION_FAILED
        );
      }
    });

    this.peer.on("error", (err) => {
      // Handle different types of peer errors
      if (err.type === "network") {
        throw new WebRTCError(
          "Network connection failed. Please check your internet connection.",
          ERROR_CODES.WEBRTC_CONNECTION_FAILED
        );
      } else if (err.type === "peer-unavailable") {
        throw new WebRTCError(
          "Unable to connect to peer. They may have left the room.",
          ERROR_CODES.WEBRTC_PEER_NOT_FOUND
        );
      } else {
        throw new WebRTCError(
          "WebRTC connection error occurred",
          ERROR_CODES.WEBRTC_CONNECTION_FAILED
        );
      }
    });
  }

  /**
   * Join a room and discover other peers
   */
  private async joinRoom(): Promise<void> {
    try {
      // Register this peer in Firebase with leader info
      await FirebaseService.registerPeerInRoom(this.roomId, this.userId, {
        peerId: this.peer.id,
        joinedAt: this.joinedAt,
        isLeader: false, // Will be updated if becomes leader
      });

      // Check if room has a leader
      const existingLeader = await FirebaseService.getRoomLeader(this.roomId);

      if (!existingLeader) {
        // No leader exists, start election
        await this.handleLeaderElection();
      } else {
        // Leader exists, set as follower
        this.currentLeader = existingLeader;
        this.isLeader = false;

        // Update connection manager with leader info
        this.connectionManager.setCurrentLeader(existingLeader);

        // Connect to leader first if not self
        if (existingLeader.userId !== this.userId) {
          this.connectionManager.connectToLeader(existingLeader.peerId);
        }
      }

      // Listen for leader changes
      FirebaseService.onLeaderChanged(this.roomId, (leader) => {
        if (leader && leader.userId !== this.userId) {
          this.currentLeader = leader;
          this.isLeader = false;

          // Update connection manager with new leader info
          this.connectionManager.setCurrentLeader(leader);

          // Connect to new leader if not already connected
          if (!this.connectionManager.isConnectedToLeader()) {
            this.connectionManager.connectToLeader(leader.peerId);
          }
        } else if (!leader) {
          // Leader disconnected
          this.connectionManager.setCurrentLeader(null);
          this.handleLeaderDisconnect();
        }
      });

      // Listen for other peers joining the room
      FirebaseService.onPeerJoined(this.roomId, (peerId, userId) => {
        try {
          if (peerId === this.peer.id) return; // Ignore self

          // If this is the leader joining and we're not the leader, prioritize connection
          if (this.currentLeader && userId === this.currentLeader.userId) {
            this.connectionManager.connectToLeader(peerId);
          } else {
            // Regular peer connection
            this.connectionManager.connectToPeer(peerId);
          }
        } catch (error) {
          // Log locally but don't disrupt the peer joining process
          console.error("Error connecting to peer:", error);
        }
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new WebRTCError(
        "Failed to join room. Please try again.",
        ERROR_CODES.WEBRTC_CONNECTION_FAILED
      );
    }
  }

  /**
   * Handle incoming messages from peers
   * @param message - The message received from a peer
   */
  private handleMessage(message: PeerMessage): void {
    // Handle specific message types internally
    if (message.type === "file-request") {
      this.handleFileRequest(message.data.id, message.sender);
      return;
    }

    if (message.type === "room-state-request") {
      // Only leader should respond to room state requests
      if (this.isLeader) {
        this.shareRoomState(message.sender);
      }
      return;
    }

    // Leader relays certain messages from followers to all peers
    if (
      this.isLeader &&
      (message.type === "text-update" || message.type === "file-metadata")
    ) {
      // Relay the message to all other peers (except sender)
      this.connectionManager.broadcast(message);
    }

    if (message.type === "leader-announcement") {
      // Update current leader information
      this.currentLeader = message.data;
      this.isLeader = false;
      this.connectionManager.setCurrentLeader(message.data);
      console.log("New leader announced:", message.data.userId);
      return;
    }

    if (message.type === "leader-election") {
      // Handle leader election messages
      this.handleLeaderElectionMessage(message);
      return;
    }

    if (message.type === "leader-handover") {
      // Handle leader handover
      this.currentLeader = message.data;
      this.isLeader = false;
      this.connectionManager.setCurrentLeader(message.data);
      console.log("Leader handover to:", message.data.userId);
      return;
    }

    // Forward the message to all registered listeners
    this.messageListeners.forEach((listener) => listener(message));
  }

  /**
   * Handle leader election message
   */
  private handleLeaderElectionMessage(
    message: Extract<PeerMessage, { type: "leader-election" }>
  ): void {
    // Compare timestamps to determine leader
    if (message.data.joinedAt < this.joinedAt) {
      // Other peer joined earlier, they should be leader
      this.isLeader = false;
    } else if (message.data.joinedAt > this.joinedAt) {
      // This peer joined earlier, should be leader
      if (!this.isLeader && !this.leaderElectionInProgress) {
        this.handleLeaderElection();
      }
    }
    // If timestamps are equal, use userId as tiebreaker
    else if (message.data.candidateId > this.userId) {
      // Other peer has higher userId, they become leader
      this.isLeader = false;
    }
  }

  /**
   * Register a callback for incoming messages
   * @param callback - The function to call when a message is received
   * @returns A function to unregister the callback
   */
  public onMessage(callback: (message: PeerMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Connect to a specific peer by their ID
   * @param peerId - The ID of the peer to connect to
   */
  public connectToPeer(peerId: string): void {
    this.connectionManager.connectToPeer(peerId);
  }

  /**
   * Share text with all connected peers
   * Leaders broadcast to all, followers send to leader who then broadcasts
   */
  public updateText(text: string): void {
    const message: PeerMessage = {
      type: "text-update",
      data: text,
      sender: this.userId,
    };

    if (this.isLeader) {
      // Leader broadcasts to all peers
      this.connectionManager.broadcast(message);
    } else {
      // Follower sends to leader, who will broadcast
      const sentToLeader = this.connectionManager.sendToLeader(message);
      if (!sentToLeader) {
        // Fallback: broadcast directly if no leader connection
        this.connectionManager.broadcast(message);
      }
    }
  }

  /**
   * Share file metadata with all connected peers
   * Leaders broadcast to all, followers send to leader who then broadcasts
   */
  public shareFile(file: File): string {
    // Generate a unique ID for the file
    const fileId = uuidv4();

    // Store the file in the local store
    this.localFileStore.set(fileId, file);

    // Share only the metadata with peers
    const message: PeerMessage = {
      type: "file-metadata",
      data: {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        sender: this.userId,
      },
      sender: this.userId,
    };

    if (this.isLeader) {
      // Leader broadcasts to all peers
      this.connectionManager.broadcast(message);
    } else {
      // Follower sends to leader, who will broadcast
      const sentToLeader = this.connectionManager.sendToLeader(message);
      if (!sentToLeader) {
        // Fallback: broadcast directly if no leader connection
        this.connectionManager.broadcast(message);
      }
    }

    return fileId;
  }

  /**
   * Request a file from the original uploader
   * @param fileId - The ID of the requested file
   * @param peerId - The peer ID of the file owner
   */
  public requestFile(fileId: string, ownerId: string): void {
    const message: PeerMessage = {
      type: "file-request",
      data: { id: fileId },
      sender: this.userId,
    };

    this.connectionManager.sendToPeerUsingId(ownerId, message);
  }

  /**
   * Handle file request from another peer
   * @param fileId - The ID of the requested file
   * @param requesterId - The ID of the peer requesting the file
   */
  private handleFileRequest(fileId: string, requesterId: string): void {
    const file = this.localFileStore.get(fileId);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || !e.target.result) return;

      const message: PeerMessage = {
        type: "file-response",
        data: {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content: e.target.result,
          sender: this.userId,
        },
        sender: this.userId,
      };

      // Send the file content to the requester
      this.connectionManager.sendToPeerUsingId(requesterId, message);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Share current room state with requested peers
   * @param peerId - The ID of the peer requesting the state
   */
  private shareRoomState(peerId: string): void {
    // Get the current text
    const text = this.getEditorText();
    // Get the current shared files and add local files
    const localFiles = Array.from(this.localFileStore.entries()).map(
      ([id, file]) => ({
        id: id,
        name: file.name,
        type: file.type,
        size: file.size,
        sender: this.userId,
      })
    );
    const sharedFiles = this.getSharedFiles();
    const allFiles = [...localFiles, ...sharedFiles];
    if (allFiles.length === 0 && !text) return;

    // Create the room state object
    const roomState = {
      text: text,
      files: allFiles,
    };
    console.log("Sharing room state with peer:", peerId);
    // Send the room state to the requesting peer
    const message: PeerMessage = {
      type: "room-state-response",
      data: roomState,
      sender: this.userId,
    };

    this.connectionManager.sendToPeerUsingId(peerId, message);
  }

  /**
   * Clean up and disconnect the service
   */
  public disconnect(): void {
    // If this peer is the leader, step down
    if (this.isLeader) {
      this.stepDownAsLeader();
    }

    // Remove this peer from Firebase
    FirebaseService.removePeerFromRoom(this.roomId, this.userId);

    // Close all peer connections
    this.connectionManager.disconnect();

    // Destroy the Peer instance
    this.peer.destroy();
  }

  /**
   * Get the peer ID of this instance
   * @returns The peer ID
   */
  public getPeerId(): string {
    return this.peer.id;
  }

  /**
   * Get the user ID of this instance
   * @returns The user ID
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Check if the peer is connected to the room
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    // Consider connected once the peer is open
    return this.peer && this.peer.id !== undefined;
  }

  /**
   * Get whether this peer is the leader
   * @returns True if this peer is the leader
   */
  public getIsLeader(): boolean {
    return this.isLeader;
  }

  /**
   * Get the current room leader
   * @returns The current leader data or null
   */
  public getCurrentLeader(): RoomLeaderData | null {
    return this.currentLeader;
  }

  /**
   * Attempt to become the room leader
   */
  private async becomeLeader(): Promise<void> {
    try {
      const leaderData: RoomLeaderData = {
        userId: this.userId,
        peerId: this.peer.id,
        joinedAt: this.joinedAt,
      };

      await FirebaseService.setRoomLeader(this.roomId, leaderData);
      this.isLeader = true;
      this.currentLeader = leaderData;

      // Update connection manager with leader info
      this.connectionManager.setCurrentLeader(leaderData);

      // Announce leadership to all connected peers
      this.announceLeadership(leaderData);

      console.log("Became room leader:", this.userId);
    } catch (error) {
      console.error("Failed to become leader:", error);
      this.isLeader = false;
    }
  }

  /**
   * Step down from leadership
   */
  private async stepDownAsLeader(): Promise<void> {
    if (!this.isLeader) return;

    try {
      await FirebaseService.removeRoomLeader(this.roomId);
      this.isLeader = false;
      this.currentLeader = null;

      // Update connection manager
      this.connectionManager.setCurrentLeader(null);

      console.log("Stepped down as leader:", this.userId);
    } catch (error) {
      console.error("Failed to step down as leader:", error);
    }
  }

  /**
   * Handle leader election process
   */
  private async handleLeaderElection(): Promise<void> {
    if (this.leaderElectionInProgress) return;

    this.leaderElectionInProgress = true;

    try {
      // Get all current peers
      const peers = await FirebaseService.getAllPeersInRoom(this.roomId);

      if (peers.length === 0) {
        // No peers found, become leader
        await this.becomeLeader();
        return;
      }

      // Find the peer with the earliest joinedAt timestamp
      const earliestPeer = peers.reduce((earliest, current) => {
        return current.peerData.joinedAt < earliest.peerData.joinedAt
          ? current
          : earliest;
      });

      // If this peer has the earliest timestamp, become leader
      if (earliestPeer.userId === this.userId) {
        await this.becomeLeader();
      } else {
        // Someone else should be leader
        this.isLeader = false;
        console.log("Another peer is the leader:", earliestPeer.userId);
      }
    } catch (error) {
      console.error("Error during leader election:", error);
    } finally {
      this.leaderElectionInProgress = false;
    }
  }

  /**
   * Announce leadership to all peers
   */
  private announceLeadership(leaderData: RoomLeaderData): void {
    const message: PeerMessage = {
      type: "leader-announcement",
      data: leaderData,
      sender: this.userId,
    };

    this.connectionManager.broadcast(message);
  }

  /**
   * Handle when the current leader disconnects
   */
  private async handleLeaderDisconnect(): Promise<void> {
    console.log("Leader disconnected, starting election...");
    this.currentLeader = null;

    // Wait a bit to allow for reconnection
    setTimeout(async () => {
      const currentLeader = await FirebaseService.getRoomLeader(this.roomId);
      if (!currentLeader) {
        // No leader exists, start election
        await this.handleLeaderElection();
      }
    }, 1000);
  }
}
