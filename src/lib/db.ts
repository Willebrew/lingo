import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Conversation, Message } from '@/types';

// Users
export async function getUser(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? (userDoc.data() as User) : null;
}

export async function searchUsersByEmail(email: string): Promise<User[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as User);
}

export async function updateUserLastSeen(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    lastSeen: Date.now(),
  });
}

// Conversations
export async function createConversation(
  participantIds: string[],
  participantDetails: { [userId: string]: { displayName: string; publicKey: string } }
): Promise<string> {
  const conversationData: Omit<Conversation, 'id'> = {
    participants: participantIds,
    participantDetails,
    createdAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, 'conversations'), conversationData);
  return docRef.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const convDoc = await getDoc(doc(db, 'conversations', conversationId));
  return convDoc.exists()
    ? ({ id: convDoc.id, ...convDoc.data() } as Conversation)
    : null;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
  );
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Conversation))
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    callback(conversations);
  });
}

// Messages
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  encryptedContent: { [recipientId: string]: string }
): Promise<string> {
  const messageData: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    senderName,
    encryptedContent,
    timestamp: Date.now(),
  };

  const docRef = await addDoc(collection(db, 'messages'), messageData);

  // Update conversation's last message info
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: 'New message',
    lastMessageAt: Date.now(),
  });

  return docRef.id;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Message)
    );
    callback(messages);
  });
}

export async function findOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  // Check if conversation already exists
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', currentUserId)
  );

  const snapshot = await getDocs(q);
  const existingConv = snapshot.docs.find((doc) => {
    const conv = doc.data() as Conversation;
    return (
      conv.participants.length === 2 &&
      conv.participants.includes(otherUserId)
    );
  });

  if (existingConv) {
    return existingConv.id;
  }

  // Create new conversation
  const [currentUser, otherUser] = await Promise.all([
    getUser(currentUserId),
    getUser(otherUserId),
  ]);

  if (!currentUser || !otherUser) {
    throw new Error('User not found');
  }

  const participantDetails = {
    [currentUserId]: {
      displayName: currentUser.displayName,
      publicKey: currentUser.publicKey,
    },
    [otherUserId]: {
      displayName: otherUser.displayName,
      publicKey: otherUser.publicKey,
    },
  };

  return await createConversation([currentUserId, otherUserId], participantDetails);
}
