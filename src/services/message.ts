import { PeerMessage } from "@/types/webrtc";

export type MessageHandler = (message: PeerMessage) => void;

export class MessageService {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private globalHandlers: MessageHandler[] = [];

  public registerHandler(
    messageType: string,
    handler: MessageHandler
  ): () => void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  public registerGlobalHandler(handler: MessageHandler): () => void {
    this.globalHandlers.push(handler);

    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  public handleMessage(message: PeerMessage): void {
    // Handle global handlers first
    this.globalHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("Error in global message handler:", error);
      }
    });

    // Handle specific message type handlers
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in ${message.type} handler:`, error);
        }
      });
    }
  }

  public clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}
