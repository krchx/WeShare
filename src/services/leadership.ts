import { FirebaseService } from "./firebase";
import { RoomLeaderData, PeerMessage } from "@/types/webrtc";

export interface LeadershipEventHandler {
  onBecameLeader(leaderData: RoomLeaderData): void;
  onLeaderChanged(leaderData: RoomLeaderData | null): void;
  onSteppedDown(): void;
  onError?(message: string, error: unknown): void;
}

export class LeadershipService {
  private userId: string;
  private peerId: string;
  private roomId: string;
  private joinedAt: number;
  private isLeader: boolean = false;
  private currentLeader: RoomLeaderData | null = null;
  private eventHandler: LeadershipEventHandler;
  private electionInProgress: boolean = false;

  constructor(
    userId: string,
    peerId: string,
    roomId: string,
    joinedAt: number,
    eventHandler: LeadershipEventHandler
  ) {
    this.userId = userId;
    this.peerId = peerId;
    this.roomId = roomId;
    this.joinedAt = joinedAt;
    this.eventHandler = eventHandler;
  }

  public async initialize(): Promise<void> {
    // Check if room has a leader
    const existingLeader = await FirebaseService.getRoomLeader(this.roomId);

    if (!existingLeader) {
      // No leader exists, start election
      await this.startElection();
    } else {
      // Leader exists, set as follower
      this.currentLeader = existingLeader;
      this.isLeader = false;
      this.eventHandler.onLeaderChanged(existingLeader);
    }

    // Listen for leader changes
    FirebaseService.onLeaderChanged(this.roomId, (leader) => {
      if (leader && leader.userId !== this.userId) {
        this.currentLeader = leader;
        this.isLeader = false;
        this.eventHandler.onLeaderChanged(leader);
      } else if (!leader) {
        // Leader disconnected
        this.currentLeader = null;
        this.handleLeaderDisconnect();
      }
    });
  }

  public async startElection(): Promise<void> {
    if (this.electionInProgress) return;

    this.electionInProgress = true;
    try {
      const peers = await FirebaseService.getAllPeersInRoom(this.roomId);

      if (peers.length === 0) {
        await this.becomeLeader();
        return;
      }

      // Find the peer with the earliest join time
      const earliestPeer = peers.reduce((earliest, current) => {
        return current.peerData.joinedAt < earliest.peerData.joinedAt
          ? current
          : earliest;
      });

      if (earliestPeer.userId === this.userId) {
        await this.becomeLeader();
      } else {
        this.isLeader = false;
        // Keep debug log for leadership changes
        console.log("Another peer is the leader:", earliestPeer.userId);
      }
    } catch (error) {
      // Use event handler for error reporting if available
      if (this.eventHandler.onError) {
        this.eventHandler.onError("Failed to complete leader election", error);
      } else {
        console.error("Error during leader election:", error);
      }
    } finally {
      this.electionInProgress = false;
    }
  }

  public async becomeLeader(): Promise<void> {
    try {
      const leaderData: RoomLeaderData = {
        userId: this.userId,
        peerId: this.peerId,
        joinedAt: this.joinedAt,
      };

      await FirebaseService.setRoomLeader(this.roomId, leaderData);
      this.isLeader = true;
      this.currentLeader = leaderData;
      this.eventHandler.onBecameLeader(leaderData);

      // Keep debug log for leadership changes
      console.log("Became room leader:", this.userId);
    } catch (error) {
      // Use event handler for error reporting if available
      if (this.eventHandler.onError) {
        this.eventHandler.onError("Failed to become room leader", error);
      } else {
        console.error("Failed to become leader:", error);
      }
      this.isLeader = false;
    }
  }

  public async stepDown(): Promise<void> {
    if (!this.isLeader) return;

    try {
      await FirebaseService.removeRoomLeader(this.roomId);
      this.isLeader = false;
      this.currentLeader = null;
      this.eventHandler.onSteppedDown();

      // Keep debug log for leadership changes
      console.log("Stepped down as leader:", this.userId);
    } catch (error) {
      // Use event handler for error reporting if available
      if (this.eventHandler.onError) {
        this.eventHandler.onError("Failed to step down as leader", error);
      } else {
        console.error("Failed to step down as leader:", error);
      }
    }
  }

  public handleLeaderDisconnect(): void {
    this.currentLeader = null;
    this.eventHandler.onLeaderChanged(null);

    // Start new election after a short delay
    setTimeout(() => {
      this.startElection();
    }, 1000);
  }

  public getIsLeader(): boolean {
    return this.isLeader;
  }

  public getCurrentLeader(): RoomLeaderData | null {
    return this.currentLeader;
  }

  public createLeaderAnnouncementMessage(): PeerMessage {
    if (!this.currentLeader) {
      throw new Error("Cannot create announcement message: no current leader");
    }

    return {
      type: "leader-announcement",
      data: this.currentLeader,
      sender: this.userId,
    };
  }
}
