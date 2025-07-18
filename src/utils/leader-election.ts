import { FirebaseService } from "@/services/firebase";
import { PeerConnectionManager } from "@/services/peer-connection";
import { RoomLeaderData, PeerMessage } from "@/types/webrtc";

export class LeaderElectionManager {
  public userId: string;
  public peerId: string;
  public roomId: string;
  public joinedAt: number;
  public isLeader: boolean = false;
  public currentLeader: RoomLeaderData | null = null;
  public leaderElectionInProgress: boolean = false;
  public connectionManager: PeerConnectionManager;
  public announceLeadership: (leaderData: RoomLeaderData) => void;

  constructor({
    userId,
    peerId,
    roomId,
    joinedAt,
    connectionManager,
    announceLeadership,
  }: {
    userId: string;
    peerId: string;
    roomId: string;
    joinedAt: number;
    connectionManager: PeerConnectionManager;
    announceLeadership: (leaderData: RoomLeaderData) => void;
  }) {
    this.userId = userId;
    this.peerId = peerId;
    this.roomId = roomId;
    this.joinedAt = joinedAt;
    this.connectionManager = connectionManager;
    this.announceLeadership = announceLeadership;
  }

  public getIsLeader() {
    return this.isLeader;
  }

  public getCurrentLeader() {
    return this.currentLeader;
  }

  public async becomeLeader() {
    try {
      const leaderData: RoomLeaderData = {
        userId: this.userId,
        peerId: this.peerId,
        joinedAt: this.joinedAt,
      };
      await FirebaseService.setRoomLeader(this.roomId, leaderData);
      this.isLeader = true;
      this.currentLeader = leaderData;
      this.connectionManager.setCurrentLeader(leaderData);
      this.announceLeadership(leaderData);
      console.log("Became room leader:", this.userId);
    } catch (error) {
      console.error("Failed to become leader:", error);
      this.isLeader = false;
    }
  }

  public async stepDownAsLeader() {
    if (!this.isLeader) return;
    try {
      await FirebaseService.removeRoomLeader(this.roomId);
      this.isLeader = false;
      this.currentLeader = null;
      this.connectionManager.setCurrentLeader(null);
      console.log("Stepped down as leader:", this.userId);
    } catch (error) {
      console.error("Failed to step down as leader:", error);
    }
  }

  public async handleLeaderElection() {
    if (this.leaderElectionInProgress) return;
    this.leaderElectionInProgress = true;
    try {
      const peers = await FirebaseService.getAllPeersInRoom(this.roomId);
      if (peers.length === 0) {
        await this.becomeLeader();
        return;
      }
      const earliestPeer = peers.reduce((earliest, current) => {
        return current.peerData.joinedAt < earliest.peerData.joinedAt
          ? current
          : earliest;
      });
      if (earliestPeer.userId === this.userId) {
        await this.becomeLeader();
      } else {
        this.isLeader = false;
        console.log("Another peer is the leader:", earliestPeer.userId);
      }
    } catch (error) {
      console.error("Error during leader election:", error);
    } finally {
      this.leaderElectionInProgress = false;
    }
  }

  public handleLeaderElectionMessage(
    message: Extract<PeerMessage, { type: "leader-election" }>
  ) {
    if (message.data.joinedAt < this.joinedAt) {
      this.isLeader = false;
    } else if (message.data.joinedAt > this.joinedAt) {
      if (!this.isLeader && !this.leaderElectionInProgress) {
        this.handleLeaderElection();
      }
    } else if (message.data.candidateId > this.userId) {
      this.isLeader = false;
    }
  }

  public async handleLeaderDisconnect() {
    console.log("Leader disconnected, starting election...");
    this.currentLeader = null;
    setTimeout(async () => {
      const currentLeader = await FirebaseService.getRoomLeader(this.roomId);
      if (!currentLeader) {
        await this.handleLeaderElection();
      }
    }, 1000);
  }
}
