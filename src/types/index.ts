export interface User {
  id: string;
  email: string;
  displayName: string;
  publicKey: string;
  preferredLanguage?: string; // ISO 639-1 language code (e.g., 'en', 'es', 'sv')
  createdAt: number;
  lastSeen: number;
  contacts?: string[]; // Array of user IDs
  status?: 'online' | 'offline'; // User status
  avatarUrl?: string; // Profile picture URL
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
  name?: string; // Custom conversation name
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
  isSystemMessage?: boolean; // For system notifications like name changes
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
  isSystemMessage?: boolean;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage?: string;
}
