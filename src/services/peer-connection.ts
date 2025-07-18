import Peer, { DataConnection } from "peerjs";
import { PeerMessage, RoomLeaderData } from "@/types/webrtc";

export class PeerConnectionManager {
  private connections: Record<string, DataConnection> = {};
  private messageHandlers: ((message: PeerMessage) => void)[] = [];
  private peer: Peer;
  private userId: string;
  private currentLeader: RoomLeaderData | null = null;
  private priorityConnections: Set<string> = new Set(); // Track leader connections

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

    // Only request room state from leader or if no leader is known
    if (!this.currentLeader || this.isLeaderConnection(conn)) {
      this.requestRoomState(conn);
    }
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
   * Connect to the leader with priority
   */
  public connectToLeader(leaderPeerId: string): void {
    if (this.connections[leaderPeerId]) return;

    this.priorityConnections.add(leaderPeerId);
    const conn = this.peer.connect(leaderPeerId);
    this.setupConnection(conn);

    // Request room state from leader immediately
    conn.on("open", () => {
      this.requestRoomState(conn);
    });
  }

  /**
   * Update current leader information
   */
  public setCurrentLeader(leader: RoomLeaderData | null): void {
    this.currentLeader = leader;
  }

  /**
   * Extract room ID from peer ID (format: roomId-userId)
   */
  private extractRoomId(peerId: string): string {
    const lastDashIndex = peerId.lastIndexOf("-");
    return lastDashIndex > 0 ? peerId.substring(0, lastDashIndex) : peerId;
  }

  /**
   * Check if a connection is to the current leader
   */
  private isLeaderConnection(conn: DataConnection): boolean {
    if (!this.currentLeader) return false;
    const roomId = this.extractRoomId(this.peer.id);
    const expectedLeaderPeerId = `${roomId}-${this.currentLeader.userId}`;
    return conn.peer === expectedLeaderPeerId;
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
      this.priorityConnections.delete(conn.peer);
      delete this.connections[conn.peer];
    });

    conn.on("error", (err) => {
      console.error("Connection error:", err);
      this.priorityConnections.delete(conn.peer);
      delete this.connections[conn.peer];
    });
  }

  /**
   * Ask the connected peer for room information
   */
  private requestRoomState(conn: DataConnection): void {
    console.log("Requesting room state from peer:", conn.peer);
    const message: PeerMessage = {
      type: "room-state-request",
      data: "",
      sender: this.userId,
    };

    if (conn.open) {
      conn.send(message);
    } else {
      conn.on("open", () => {
        conn.send(message);
      });
    }
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

  /**
   * Check if connected to the current leader
   */
  public isConnectedToLeader(): boolean {
    if (!this.currentLeader) return false;

    const roomId = this.extractRoomId(this.peer.id);
    const leaderPeerId = `${roomId}-${this.currentLeader.userId}`;
    return !!this.connections[leaderPeerId];
  }

  /**
   * Get leader connection if available
   */
  public getLeaderConnection(): DataConnection | null {
    if (!this.currentLeader) return null;

    const roomId = this.extractRoomId(this.peer.id);
    const leaderPeerId = `${roomId}-${this.currentLeader.userId}`;
    return this.connections[leaderPeerId] || null;
  }

  /**
   * Send message specifically to leader
   */
  public sendToLeader(message: PeerMessage): boolean {
    const leaderConn = this.getLeaderConnection();
    if (leaderConn && leaderConn.open) {
      leaderConn.send(message);
      return true;
    }
    return false;
  }

  /**
   * Broadcast with leader priority (send to leader first)
   */
  public broadcastWithLeaderPriority(message: PeerMessage): void {
    // Send to leader first if connected
    const leaderConn = this.getLeaderConnection();
    if (leaderConn && leaderConn.open) {
      leaderConn.send(message);
    }

    // Then send to all other peers
    Object.values(this.connections).forEach((conn) => {
      if (conn.open && conn !== leaderConn) {
        conn.send(message);
      }
    });
  }
}
