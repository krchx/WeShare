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
  static registerPeerInRoom(
    roomId: string,
    userId: string,
    peerData: PeerData
  ): void {
    const peerRef = ref(database, `rooms/${roomId}/peers/${userId}`);
    set(peerRef, peerData);

    // Remove the peer data when disconnected
    onDisconnect(peerRef).remove();
  }

  /**
   * Listen for new peers joining the room
   */
  static onPeerJoined(
    roomId: string,
    callback: (peerId: string, userId: string) => void
  ): () => void {
    const roomPeersRef = ref(database, `rooms/${roomId}/peers`);

    const unsubscribe = onChildAdded(roomPeersRef, (snapshot) => {
      const peerData = snapshot.val() as PeerData;
      const userId = snapshot.key as string;
      callback(peerData.peerId, userId);
    });

    // Return an unsubscribe function
    return () => unsubscribe();
  }

  /**
   * Set up a listener for user disconnections
   */
  static listenForDisconnections(
    roomId: string,
    callback: (userId: string) => void
  ) {
    const roomRef = ref(database, `rooms/${roomId}/users`);

    return onChildRemoved(roomRef, (snapshot) => {
      const userId = snapshot.key;
      if (userId) {
        callback(userId);
      }
    });
  }

  /**
   * Properly disconnect a user when they leave
   */
  static async disconnectUser(roomId: string, userId: string) {
    try {
      const userRef = ref(database, `rooms/${roomId}/users/${userId}`);
      await remove(userRef);

      // Also remove any associated messages or state
      const messagesRef = ref(database, `rooms/${roomId}/messages/${userId}`);
      await remove(messagesRef);

      return true;
    } catch (error) {
      console.error("Error disconnecting user:", error);
      return false;
    }
  }

  /**
   * Remove a peer from a room when they leave
   */
  static removePeerFromRoom(roomId: string, userId: string): void {
    const peerRef = ref(database, `rooms/${roomId}/peers/${userId}`);
    remove(peerRef);
  }

  /**
   * Check if a room exists
   */
  static async checkRoomExists(roomId: string): Promise<boolean> {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    return snapshot.exists();
  }
}
