export type SenderType = "user" | "character" | "system";

export type MessageType = "text" | "image" | "voice" | "share_card";

export type MessageStatus =
  | "sent"
  | "failed"
  | "generating"
  | "uploading"
  | "understanding";

export type MemoryProcessStatus = "pending" | "processed" | "failed";

export interface Message {
  id: string;
  userId: string;
  characterId: string;
  senderType: SenderType;
  messageType: MessageType;
  contentText: string | null;
  fileId: string | null;
  sttText: string | null;
  imageDescription: string | null;
  replyGroupId: string | null;
  status: MessageStatus;
  errorCode: string | null;
  retryCount: number;
  memoryProcessStatus: MemoryProcessStatus;
  memoryProcessedAt: Date | null;
  createdAt: Date;
}
