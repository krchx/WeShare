import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onChildAdded,
  onDisconnect,
  remove,
  get,
  onChildRemoved,
} from "firebase/database";
import { PeerData } from "@/types/webrtc";
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
   * Set up a listener for user disconnections
   */
  static listenForDisconnections(
    roomId: string,
    callback: (userId: string) => void
  ) {
    try {
      const roomRef = ref(database, `rooms/${roomId}/users`);

      return onChildRemoved(roomRef, (snapshot) => {
        try {
          const userId = snapshot.key;
          if (userId) {
            callback(userId);
          }
        } catch (error) {
          // Log locally but don't throw to avoid disrupting the listener
          console.error("Error processing disconnection event:", error);
        }
      });
    } catch {
      throw new FirebaseError(
        "Failed to set up disconnection listener",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Properly disconnect a user when they leave
   */
  static async disconnectUser(
    roomId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const userRef = ref(database, `rooms/${roomId}/users/${userId}`);
      await remove(userRef);

      // Also remove any associated messages or state
      const messagesRef = ref(database, `rooms/${roomId}/messages/${userId}`);
      await remove(messagesRef);

      return true;
    } catch {
      throw new FirebaseError(
        "Failed to disconnect user properly",
        ERROR_CODES.FIREBASE_NETWORK_ERROR
      );
    }
  }

  /**
   * Remove a peer from a room when they leave
   */
  static async removePeerFromRoom(
    roomId: string,
    userId: string
  ): Promise<void> {
    try {
      const peerRef = ref(database, `rooms/${roomId}/peers/${userId}`);
      await remove(peerRef);
    } catch {
      throw new FirebaseError(
        "Failed to remove peer from room",
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
}
