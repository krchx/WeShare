import Peer from "peerjs";
import { PeerConnectionManager } from "@/services/peer-connection";
import { FirebaseService } from "@/services/firebase";
import { PeerMessage } from "@/types/webrtc";
import { generateUserId } from "./idGenerator";

// WebRTCService class definition
export class WebRTCService {
  // Private properties
  private peer: Peer;
  private connectionManager: PeerConnectionManager;
  private userId: string;
  private roomId: string;
  private messageListeners: ((message: PeerMessage) => void)[] = [];

  /**
   * Constructor: Initializes the WebRTC service for a specific room
   * @param roomId - The ID of the room to join
   */
  constructor(roomId: string, getEditorText: () => string) {
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
    });

    // Initialize the connection manager
    this.connectionManager = new PeerConnectionManager(
      this.peer,
      this.userId,
      getEditorText
    );

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

    // Listen for other peers joining the room
    FirebaseService.onPeerJoined(this.roomId, (peerId, userId) => {
      // Avoid connecting to yourself
      if (userId !== this.userId) {
        this.connectionManager.connectToPeer(peerId);
      }
    });
  }

  /**
   * Handle incoming messages from peers
   * @param message - The message received from a peer
   */
  private handleMessage(message: PeerMessage): void {
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
   * Share a file with all connected peers
   * @param file - The file to share
   */
  public shareFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target || !e.target.result) return;

      const message: PeerMessage = {
        type: "file-share",
        data: {
          name: file.name,
          type: file.type,
          size: file.size,
          content: e.target.result,
        },
        sender: this.userId,
      };

      this.connectionManager.broadcast(message);
    };

    reader.readAsDataURL(file);
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
