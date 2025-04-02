import Peer from "peerjs";
import { PeerConnectionManager } from "@/services/peer-connection";
import { FirebaseService } from "@/services/firebase";
import { PeerMessage, SharedFile } from "@/types/webrtc";
import { generateUserId } from "./idGenerator";
import { v4 as uuidv4 } from "uuid";

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
      this.joinRoom(); // Automatically join the room when the peer is ready
    });

    this.peer.on("error", (err) => {
      console.error("Peer error:", err); // Log any errors
    });
  }

  /**
   * Join a room and discover other peers
   */
  private joinRoom(): void {
    // Register this peer in Firebase
    FirebaseService.registerPeerInRoom(this.roomId, this.userId, {
      peerId: this.peer.id,
      joinedAt: Date.now(),
    });

    // // Listen for other peers joining the room
    FirebaseService.onPeerJoined(this.roomId, (peerId) => {
      if (peerId === this.peer.id) return; // Ignore self
      // Avoid connecting to yourself
      this.connectionManager.connectToPeer(peerId);
    });
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
      // Handle room state request
      this.shareRoomState(message.sender);
      return;
    }

    // Forward the message to all registered listeners
    this.messageListeners.forEach((listener) => listener(message));
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
   * @param text - The text to share
   */
  public updateText(text: string): void {
    const message: PeerMessage = {
      type: "text-update",
      data: text,
      sender: this.userId,
    };

    this.connectionManager.broadcast(message);
  }

  /**
   * Share file metadata with all connected peers
   * @param file - The file to share
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

    this.connectionManager.broadcast(message);
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
    if (!text) return;
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
    // Create the room state object
    const roomState = {
      text: text,
      files: allFiles,
    };
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
}
