export interface SharedFile {
    name: string;
    type: string;
    size: number;
    content: string | ArrayBuffer; // Base64 or binary data
    sender: string;
  }