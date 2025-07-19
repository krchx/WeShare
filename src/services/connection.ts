import Peer, { DataConnection } from "peerjs";
import { PeerMessage } from "@/types/webrtc";

export interface ConnectionEventHandler {
  onConnectionOpen(peerId: string): void;
  onConnectionClose(peerId: string): void;
  onConnectionError(peerId: string, error: Error): void;
  onMessage(message: PeerMessage): void;
}

export class ConnectionService {
  private connections: Map<string, DataConnection> = new Map();
  private peer: Peer;
  private eventHandler: ConnectionEventHandler;

  constructor(peer: Peer, eventHandler: ConnectionEventHandler) {
    this.peer = peer;
    this.eventHandler = eventHandler;
    this.setupPeerEvents();
  }

  private setupPeerEvents(): void {
    this.peer.on("connection", (conn) => {
      this.setupConnection(conn);
    });
  }

  public connectToPeer(peerId: string): void {
    if (this.connections.has(peerId) || peerId === this.peer.id) return;

    const conn = this.peer.connect(peerId);
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection): void {
    this.connections.set(conn.peer, conn);

    conn.on("open", () => {
      this.eventHandler.onConnectionOpen(conn.peer);
    });

    conn.on("data", (data: unknown) => {
      this.eventHandler.onMessage(data as PeerMessage);
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.eventHandler.onConnectionClose(conn.peer);
    });

    conn.on("error", (err) => {
      this.connections.delete(conn.peer);
      this.eventHandler.onConnectionError(conn.peer, err);
    });
  }

  public sendToConnection(peerId: string, message: PeerMessage): boolean {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
      return true;
    }
    return false;
  }

  public broadcast(message: PeerMessage): void {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  public getConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  public isConnectedTo(peerId: string): boolean {
    return this.connections.has(peerId);
  }

  public disconnect(): void {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
  }
}
