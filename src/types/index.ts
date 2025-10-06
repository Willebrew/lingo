export interface User {
  id: string;
  email: string;
  displayName: string;
  publicKey: string;
  createdAt: number;
  lastSeen: number;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  participantDetails: {
    [userId: string]: {
      displayName: string;
      publicKey: string;
    };
  };
  lastMessage?: string;
  lastMessageAt?: number;
  createdAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  encryptedContent: {
    [recipientId: string]: string; // Encrypted for each recipient
  };
  timestamp: number;
  translated?: boolean;
}

export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
}

export interface DecryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  translated?: boolean;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage?: string;
}
