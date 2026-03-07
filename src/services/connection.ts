import Peer, { DataConnection } from "peerjs";
import { PeerMessage } from "@/types/webrtc";

interface ConnectionServiceOptions {
  shouldInitiateConnection?: (peerId: string) => boolean;
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  pendingConnectionTimeoutMs?: number;
  iceDisconnectGracePeriodMs?: number;
}

export interface ConnectionEventHandler {
  onConnectionOpen(peerId: string): void;
  onConnectionClose(peerId: string): void;
  onConnectionError(peerId: string, error: Error): void;
  onMessage(message: PeerMessage): void;
}

export class ConnectionService {
  private connections: Map<string, DataConnection> = new Map();
  private connectionSources: Map<string, "incoming" | "outgoing"> = new Map();
  private openedConnections: Set<string> = new Set();
  private pendingConnections: Set<string> = new Set();
  private pendingConnectionTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private iceDisconnectTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private retryCounts: Map<string, number> = new Map();
  private manuallyClosedPeers: Set<string> = new Set();
  private isDisconnecting = false;
  private peer: Peer;
  private eventHandler: ConnectionEventHandler;
  private shouldInitiateConnection: (peerId: string) => boolean;
  private maxReconnectAttempts: number;
  private baseReconnectDelayMs: number;
  private pendingConnectionTimeoutMs: number;
  private iceDisconnectGracePeriodMs: number;

  constructor(
    peer: Peer,
    eventHandler: ConnectionEventHandler,
    options: ConnectionServiceOptions = {},
  ) {
    this.peer = peer;
    this.eventHandler = eventHandler;
    this.shouldInitiateConnection =
      options.shouldInitiateConnection ?? (() => true);
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.baseReconnectDelayMs = options.baseReconnectDelayMs ?? 1000;
    this.pendingConnectionTimeoutMs =
      options.pendingConnectionTimeoutMs ?? 10000;
    this.iceDisconnectGracePeriodMs =
      options.iceDisconnectGracePeriodMs ?? 5000;
    this.setupPeerEvents();
  }

  private setupPeerEvents(): void {
    this.peer.on("connection", (conn) => {
      if (this.isDisconnecting || conn.peer === this.peer.id) {
        conn.close();
        return;
      }

      const existingConnection = this.connections.get(conn.peer);
      const existingSource = this.connectionSources.get(conn.peer);
      const preferExistingOutgoingConnection =
        this.shouldInitiateConnection(conn.peer) &&
        existingSource === "outgoing";

      if (
        existingConnection &&
        (existingConnection.open || preferExistingOutgoingConnection)
      ) {
        conn.close();
        return;
      }

      if (existingConnection) {
        this.closeConnection(conn.peer);
      }

      this.pendingConnections.delete(conn.peer);
      this.setupConnection(conn, "incoming");
    });
  }

  public connectToPeer(peerId: string, force = false): void {
    if (this.isDisconnecting || peerId === this.peer.id) {
      return;
    }

    if (!force && !this.shouldInitiateConnection(peerId)) {
      return;
    }

    const existingConnection = this.connections.get(peerId);
    if (existingConnection?.open || this.pendingConnections.has(peerId)) {
      return;
    }

    if (existingConnection) {
      this.closeConnection(peerId);
    }

    const reconnectTimer = this.reconnectTimers.get(peerId);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.reconnectTimers.delete(peerId);
    }

    this.pendingConnections.add(peerId);
    this.startPendingConnectionTimeout(peerId);
    const conn = this.peer.connect(peerId, {
      metadata: {
        initiator: this.peer.id,
        startedAt: Date.now(),
      },
    });
    this.setupConnection(conn, "outgoing");
  }

  private setupConnection(
    conn: DataConnection,
    source: "incoming" | "outgoing",
  ): void {
    this.connections.set(conn.peer, conn);
    this.connectionSources.set(conn.peer, source);
    this.attachIceStateListener(conn);

    let terminalEventHandled = false;

    const handleTerminalEvent = (error?: Error): void => {
      if (terminalEventHandled) {
        return;
      }

      terminalEventHandled = true;

      const isCurrentConnection = this.connections.get(conn.peer) === conn;
      if (!isCurrentConnection) {
        return;
      }

      const hadOpened = this.openedConnections.delete(conn.peer);
      this.clearPendingConnectionTimeout(conn.peer);
      this.clearIceDisconnectTimer(conn.peer);
      this.pendingConnections.delete(conn.peer);
      this.connections.delete(conn.peer);
      this.connectionSources.delete(conn.peer);

      const wasManuallyClosed = this.manuallyClosedPeers.delete(conn.peer);

      if (error) {
        this.eventHandler.onConnectionError(conn.peer, error);
      } else if (hadOpened) {
        this.eventHandler.onConnectionClose(conn.peer);
      }

      if (
        !this.isDisconnecting &&
        !wasManuallyClosed &&
        this.shouldInitiateConnection(conn.peer)
      ) {
        this.scheduleReconnect(conn.peer);
      }
    };

    conn.on("open", () => {
      this.clearPendingConnectionTimeout(conn.peer);
      this.clearIceDisconnectTimer(conn.peer);
      this.pendingConnections.delete(conn.peer);
      this.openedConnections.add(conn.peer);
      this.retryCounts.delete(conn.peer);

      const reconnectTimer = this.reconnectTimers.get(conn.peer);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        this.reconnectTimers.delete(conn.peer);
      }

      this.eventHandler.onConnectionOpen(conn.peer);
    });

    conn.on("data", (data: unknown) => {
      this.eventHandler.onMessage(data as PeerMessage);
    });

    conn.on("close", () => {
      handleTerminalEvent();
    });

    conn.on("error", (err) => {
      handleTerminalEvent(
        err instanceof Error ? err : new Error("Peer connection failed"),
      );
    });
  }

  private attachIceStateListener(conn: DataConnection): void {
    const peerConnection = (
      conn as DataConnection & {
        peerConnection?: RTCPeerConnection;
      }
    ).peerConnection;

    if (!peerConnection) {
      return;
    }

    peerConnection.addEventListener("iceconnectionstatechange", () => {
      if (peerConnection.iceConnectionState === "failed") {
        conn.close();
        return;
      }

      if (peerConnection.iceConnectionState === "disconnected") {
        if (this.iceDisconnectTimers.has(conn.peer)) {
          return;
        }

        const disconnectTimer = setTimeout(() => {
          this.iceDisconnectTimers.delete(conn.peer);

          if (peerConnection.iceConnectionState === "disconnected") {
            conn.close();
          }
        }, this.iceDisconnectGracePeriodMs);

        this.iceDisconnectTimers.set(conn.peer, disconnectTimer);
        return;
      }

      if (
        peerConnection.iceConnectionState === "connected" ||
        peerConnection.iceConnectionState === "completed"
      ) {
        this.clearIceDisconnectTimer(conn.peer);
      }
    });
  }

  private startPendingConnectionTimeout(peerId: string): void {
    this.clearPendingConnectionTimeout(peerId);

    const pendingTimer = setTimeout(() => {
      this.pendingConnectionTimers.delete(peerId);

      if (!this.pendingConnections.has(peerId)) {
        return;
      }

      this.pendingConnections.delete(peerId);

      const connection = this.connections.get(peerId);
      if (connection && !connection.open) {
        this.connections.delete(peerId);
        this.connectionSources.delete(peerId);

        try {
          connection.close();
        } catch {
          // Ignore close errors from half-open PeerJS connections.
        }
      }

      if (!this.isDisconnecting && this.shouldInitiateConnection(peerId)) {
        this.scheduleReconnect(peerId);
      }
    }, this.pendingConnectionTimeoutMs);

    this.pendingConnectionTimers.set(peerId, pendingTimer);
  }

  private clearPendingConnectionTimeout(peerId: string): void {
    const pendingTimer = this.pendingConnectionTimers.get(peerId);
    if (!pendingTimer) {
      return;
    }

    clearTimeout(pendingTimer);
    this.pendingConnectionTimers.delete(peerId);
  }

  private clearIceDisconnectTimer(peerId: string): void {
    const disconnectTimer = this.iceDisconnectTimers.get(peerId);
    if (!disconnectTimer) {
      return;
    }

    clearTimeout(disconnectTimer);
    this.iceDisconnectTimers.delete(peerId);
  }

  private scheduleReconnect(peerId: string): void {
    if (this.reconnectTimers.has(peerId)) {
      return;
    }

    const nextRetryCount = (this.retryCounts.get(peerId) ?? 0) + 1;
    if (nextRetryCount > this.maxReconnectAttempts) {
      this.retryCounts.delete(peerId);
      return;
    }

    this.retryCounts.set(peerId, nextRetryCount);
    const delay = this.baseReconnectDelayMs * 2 ** (nextRetryCount - 1);
    const reconnectTimer = setTimeout(() => {
      this.reconnectTimers.delete(peerId);
      this.connectToPeer(peerId, true);
    }, delay);

    this.reconnectTimers.set(peerId, reconnectTimer);
  }

  private closeConnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (!connection) {
      return;
    }

    this.manuallyClosedPeers.add(peerId);
    this.clearPendingConnectionTimeout(peerId);
    this.clearIceDisconnectTimer(peerId);
    this.pendingConnections.delete(peerId);
    this.openedConnections.delete(peerId);
    this.connections.delete(peerId);
    this.connectionSources.delete(peerId);

    try {
      connection.close();
    } finally {
      this.manuallyClosedPeers.delete(peerId);
    }
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
    return Array.from(this.connections.entries())
      .filter(([, conn]) => conn.open)
      .map(([peerId]) => peerId);
  }

  public isConnectedTo(peerId: string): boolean {
    return this.connections.get(peerId)?.open ?? false;
  }

  public forgetPeer(peerId: string): void {
    this.clearPendingConnectionTimeout(peerId);
    this.clearIceDisconnectTimer(peerId);

    const reconnectTimer = this.reconnectTimers.get(peerId);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.reconnectTimers.delete(peerId);
    }

    this.retryCounts.delete(peerId);
    this.pendingConnections.delete(peerId);

    if (this.connections.has(peerId)) {
      this.closeConnection(peerId);
    }
  }

  public disconnect(): void {
    this.isDisconnecting = true;

    this.pendingConnectionTimers.forEach((timer) => clearTimeout(timer));
    this.pendingConnectionTimers.clear();
    this.iceDisconnectTimers.forEach((timer) => clearTimeout(timer));
    this.iceDisconnectTimers.clear();
    this.reconnectTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectTimers.clear();
    this.retryCounts.clear();

    this.connections.forEach((_, peerId) => this.closeConnection(peerId));
    this.connections.clear();
    this.connectionSources.clear();
    this.pendingConnections.clear();
    this.openedConnections.clear();
    this.manuallyClosedPeers.clear();
  }
}
