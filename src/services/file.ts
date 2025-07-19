import { SharedFile, PeerMessage } from "@/types/webrtc";
import { v4 as uuidv4 } from "uuid";
import { FILE_SIZE_LIMITS } from "@/utils/fileDownload";

export interface FileEventHandler {
  onFileAdded(file: SharedFile): void;
  onFileRemoved(fileId: string): void;
  onFileRequested(fileId: string, requesterId: string): void;
  onFileReceived(fileId: string, fileData: ArrayBuffer): void;
}

export class FileService {
  private localFiles: Map<string, File> = new Map();
  private sharedFiles: Map<string, SharedFile> = new Map();
  private eventHandler: FileEventHandler;
  private userId: string;

  constructor(userId: string, eventHandler: FileEventHandler) {
    this.userId = userId;
    this.eventHandler = eventHandler;
  }

  public addFile(file: File): string {
    // Validate file size (50MB limit to match legacy behavior)
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      throw new Error(
        `File "${file.name}" is too large. Maximum size is ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB.`
      );
    }

    const fileId = uuidv4();
    this.localFiles.set(fileId, file);

    const sharedFile: SharedFile = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      sender: this.userId,
    };

    this.sharedFiles.set(fileId, sharedFile);
    this.eventHandler.onFileAdded(sharedFile);

    return fileId;
  }

  public removeFile(fileId: string): void {
    this.localFiles.delete(fileId);
    this.sharedFiles.delete(fileId);
    this.eventHandler.onFileRemoved(fileId);
  }

  public getFile(fileId: string): File | null {
    return this.localFiles.get(fileId) || null;
  }

  public getAllSharedFiles(): SharedFile[] {
    return Array.from(this.sharedFiles.values());
  }

  public addSharedFile(sharedFile: SharedFile): void {
    this.sharedFiles.set(sharedFile.id, sharedFile);
    this.eventHandler.onFileAdded(sharedFile);
  }

  public async handleFileRequest(
    fileId: string,
    requesterId: string
  ): Promise<ArrayBuffer | null> {
    const file = this.localFiles.get(fileId);
    if (file) {
      this.eventHandler.onFileRequested(fileId, requesterId);
      return await file.arrayBuffer();
    }
    return null;
  }

  public handleFileResponse(fileId: string, fileData: ArrayBuffer): void {
    this.eventHandler.onFileReceived(fileId, fileData);
  }

  public createFileMetadataMessage(fileId: string): PeerMessage | null {
    const sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) return null;

    return {
      type: "file-metadata",
      data: sharedFile,
      sender: this.userId,
    };
  }

  public createFileRequestMessage(fileId: string): PeerMessage {
    return {
      type: "file-request",
      data: { id: fileId },
      sender: this.userId,
    };
  }

  public createFileResponseMessage(
    fileId: string,
    fileData: ArrayBuffer
  ): PeerMessage {
    return {
      type: "file-response",
      data: { fileId, fileData },
      sender: this.userId,
    };
  }

  public clear(): void {
    this.localFiles.clear();
    this.sharedFiles.clear();
  }
}
