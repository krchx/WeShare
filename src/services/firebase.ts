import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onChildAdded,
  onDisconnect,
  get,
  onValue,
} from "firebase/database";
import { PeerData, RoomLeaderData } from "@/types/webrtc";
import { FirebaseError, ERROR_CODES } from "@/lib/errors";

// Initialize Firebase - Add your config here
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  /**
   * Register a user in a room
   */
  static async registerPeerInRoom(
    roomId: string,
    userId: string,
    peerData: PeerData
  ): Promise<void> {
    try {
      const peerRef = ref(database, `rooms/${roomId}/peers/${userId}`);
      await set(peerRef, peerData);

      // Remove the peer data when disconnected
      onDisconnect(peerRef).remove();
    } catch {
      throw new FirebaseError(
        "Failed to register peer in room. Please try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Listen for new peers joining the room
   */
  static onPeerJoined(
    roomId: string,
    callback: (peerId: string, userId: string) => void
  ): () => void {
    try {
      const roomPeersRef = ref(database, `rooms/${roomId}/peers`);

      const unsubscribe = onChildAdded(roomPeersRef, (snapshot) => {
        try {
          const peerData = snapshot.val() as PeerData;
          const userId = snapshot.key as string;

          if (!peerData || !userId) {
            throw new FirebaseError(
              "Invalid peer data received",
              ERROR_CODES.FIREBASE_NETWORK_ERROR
            );
          }

          callback(peerData.peerId, userId);
        } catch (error) {
          // Log locally but don't throw to avoid disrupting the listener
          console.error("Error processing peer joined event:", error);
        }
      });

      // Return an unsubscribe function
      return () => unsubscribe();
    } catch {
      throw new FirebaseError(
        "Failed to listen for peer connections. Please refresh and try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Check if a room exists
   */
  static async checkRoomExists(roomId: string): Promise<boolean> {
    try {
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      return snapshot.exists();
    } catch {
      throw new FirebaseError(
        "Failed to check if room exists. Please try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Set the room leader
   */
  static async setRoomLeader(
    roomId: string,
    leaderData: RoomLeaderData
  ): Promise<void> {
    try {
      const leaderRef = ref(database, `rooms/${roomId}/leader`);
      await set(leaderRef, leaderData);

      // Remove the leader data when disconnected
      onDisconnect(leaderRef).remove();
    } catch {
      throw new FirebaseError(
        "Failed to set room leader. Please try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Get the current room leader
   */
  static async getRoomLeader(roomId: string): Promise<RoomLeaderData | null> {
    try {
      const leaderRef = ref(database, `rooms/${roomId}/leader`);
      const snapshot = await get(leaderRef);

      if (snapshot.exists()) {
        return snapshot.val() as RoomLeaderData;
      }

      return null;
    } catch {
      throw new FirebaseError(
        "Failed to get room leader. Please try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Listen for leader changes in the room
   */
  static onLeaderChanged(
    roomId: string,
    callback: (leader: RoomLeaderData | null) => void
  ): () => void {
    try {
      const leaderRef = ref(database, `rooms/${roomId}/leader`);

      const unsubscribe = onValue(leaderRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const leaderData = snapshot.val() as RoomLeaderData;
            callback(leaderData);
          } else {
            callback(null);
          }
        } catch (error) {
          // Log locally but don't throw to avoid disrupting the listener
          console.error("Error processing leader change event:", error);
        }
      });

      return () => unsubscribe();
    } catch {
      throw new FirebaseError(
        "Failed to listen for leader changes. Please refresh and try again.",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Get all peers in a room (for leader election)
   */
  static async getAllPeersInRoom(
    roomId: string
  ): Promise<{ userId: string; peerData: PeerData }[]> {
    try {
      const peersRef = ref(database, `rooms/${roomId}/peers`);
      const snapshot = await get(peersRef);

      if (!snapshot.exists()) {
        return [];
      }

      const peers: { userId: string; peerData: PeerData }[] = [];
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key as string;
        const peerData = childSnapshot.val() as PeerData;
        if (userId && peerData) {
          peers.push({ userId, peerData });
        }
      });

      return peers;
    } catch {
      throw new FirebaseError(
        "Failed to get peers for leader election",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }
}
