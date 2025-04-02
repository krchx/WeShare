import Peer, { DataConnection } from "peerjs";
import { PeerMessage } from "@/types/webrtc";

export class PeerConnectionManager {
  private connections: Record<string, DataConnection> = {};
  private messageHandlers: ((message: PeerMessage) => void)[] = [];
  private peer: Peer;
  private userId: string;

  constructor(peer: Peer, userId: string) {
    this.peer = peer;
    this.userId = userId;

    // Set up connection handler
    this.peer.on("connection", this.handleIncomingConnection.bind(this));
  }

  /**
   * Handle incoming connections from other peers
   */
  private handleIncomingConnection(conn: DataConnection): void {
    this.setupConnection(conn);
    this.RoomStateRequest(conn);
  }

  /**
   * Connect to another peer
   */
  public connectToPeer(peerId: string): void {
    // Don't connect if already connected or trying to connect to self
    if (this.connections[peerId] || peerId === this.peer.id) return;

    // console.log("Connecting to peer:", peerId);
    const conn = this.peer.connect(peerId);
    this.setupConnection(conn);
  }

  /**
   * Set up event handlers for a connection
   */
  private setupConnection(conn: DataConnection): void {
    // Store the connection
    this.connections[conn.peer] = conn;

    conn.on("open", () => {
      // Send introduction message
      this.sendToPeer(conn, {
        type: "user-joined",
        data: { userId: this.userId },
        sender: this.userId,
      });
    });

    conn.on("data", (data: unknown) => {
      const message = data as PeerMessage;

      // Notify all message handlers
      this.messageHandlers.forEach((handler) => handler(message));
    });

    conn.on("close", () => {
      console.log("Connection closed:", conn.peer);
      delete this.connections[conn.peer];
    });

    conn.on("error", (err) => {
      console.error("Connection error:", err);
      delete this.connections[conn.peer];
    });
  }

  /**
   * Ask the connected peer for room information
   */
  private RoomStateRequest(conn: DataConnection): void {
    const message: PeerMessage = {
      type: "room-state-request",
      data: "",
      sender: this.userId,
    };

    conn.on("open", () => {
      conn.send(message);
    });
  }

  /**
   * Send a message to a specific peer
   */
  private sendToPeer(conn: DataConnection, message: PeerMessage): void {
    if (conn.open) {
      conn.send(message);
    }
  }

  /**
   * Send a message to a specific peer by their user ID
   */
  public sendToPeerUsingId(userId: string, message: PeerMessage): void {
    // Find the connection that corresponds to this user ID

    const peerEntry = Object.entries(this.connections).find(([, conn]) => {
      // Check any stored data about this connection
      return conn.peer.split("-")[1] === userId;
    });

    if (peerEntry) {
      const [, conn] = peerEntry;
      if (conn.open) {
        conn.send(message);
      }
    } else {
      console.warn(`No connection found for user ID: ${userId} (${userId})`);
    }
  }

  /**
   * Broadcast a message to all connected peers
   */
  public broadcast(message: PeerMessage): void {
    Object.values(this.connections).forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  /**
   * Register a handler for incoming messages
   */
  public onMessage(handler: (message: PeerMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Close all connections
   */
  public disconnect(): void {
    Object.values(this.connections).forEach((conn) => conn.close());
    this.connections = {};
  }

  /**
   * Get the number of active connections
   */
  public getConnectionCount(): number {
    return Object.keys(this.connections).length;
  }
}
