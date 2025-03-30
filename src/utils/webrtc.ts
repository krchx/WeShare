import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { PeerConnectionManager } from '@/services/peer-connection';
import { FirebaseService } from '@/services/firebase';
import { PeerMessage } from '@/types/webrtc';
import { generateCatchyUserId } from './idGenerator';

export class WebRTCService {
  private peer: Peer;
  private connectionManager: PeerConnectionManager;
  private userId: string;
  private roomId: string;
  private messageListeners: ((message: PeerMessage) => void)[] = [];

  /**
   * Create a new WebRTC service for a specific room
   */
  constructor(roomId: string) {
    this.userId = generateCatchyUserId();
    this.roomId = roomId;
    
    // Create a new peer with a unique ID
    this.peer = new Peer(`${roomId}-${this.userId}`, {
      debug: 2,
    });

    // Initialize the connection manager
    this.connectionManager = new PeerConnectionManager(this.peer, this.userId);
    
    // Register message handler
    this.connectionManager.onMessage(this.handleMessage.bind(this));

    // Set up peer event handlers
    this.setupPeerEvents();
  }

  /**
   * Set up peer event handlers
   */
  private setupPeerEvents(): void {
    this.peer.on('open', () => {
      // console.log('My peer ID is:', this.peer.id);
      this.joinRoom();
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
    });
  }

  /**
   * Join a room and discover other peers
   */
  private joinRoom(): void {
    // Register this peer in Firebase
    FirebaseService.registerPeerInRoom(this.roomId, this.userId, {
      peerId: this.peer.id,
      joinedAt: Date.now()
    });
    
    // Listen for other peers joining
    FirebaseService.onPeerJoined(this.roomId, (peerId, userId) => {
      // Don't connect to yourself
      if (userId !== this.userId) {
        this.connectionManager.connectToPeer(peerId);
      }
    });
  }

  /**
   * Handle incoming messages from peers
   */
  private handleMessage(message: PeerMessage): void {
    // Forward message to all listeners
    this.messageListeners.forEach(listener => listener(message));
  }

  /**
   * Register a callback for incoming messages
   */
  public onMessage(callback: (message: PeerMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Connect to a specific peer by ID
   */
  public connectToPeer(peerId: string): void {
    this.connectionManager.connectToPeer(peerId);
  }

  /**
   * Share text with all connected peers
   */
  public updateText(text: string): void {
    const message: PeerMessage = {
      type: 'text-update',
      data: text,
      sender: this.userId
    };
    
    this.connectionManager.broadcast(message);
  }

  /**
   * Share a file with all connected peers
   */
  public shareFile(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (!e.target || !e.target.result) return;
      
      const message: PeerMessage = {
        type: 'file-share',
        data: {
          name: file.name,
          type: file.type,
          size: file.size,
          content: e.target.result
        },
        sender: this.userId
      };
      
      this.connectionManager.broadcast(message);
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Clean up and disconnect when the service is no longer needed
   */
  public disconnect(): void {
    // Remove from Firebase
    FirebaseService.removePeerFromRoom(this.roomId, this.userId);
    
    // Close all peer connections
    this.connectionManager.disconnect();
    
    // Destroy the peer object
    this.peer.destroy();
  }

  /**
   * Get the peer ID
   */
  public getPeerId(): string {
    return this.peer.id;
  }

  /**
   * Get the user ID
   */
  public getUserId(): string {
    return this.userId;
  }
  /**
   * Check if connected to the room
   */
  public isConnected(): boolean {
    // Consider connected once the peer is open
    return this.peer && this.peer.id !== undefined;
  }
}
