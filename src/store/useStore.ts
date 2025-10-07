import { create } from 'zustand';
import type { User, Conversation, DecryptedMessage } from '@/types';

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Password state (for key encryption)
  userPassword: string | null;
  setUserPassword: (password: string | null) => void;

  // Signup state (prevent auto-login during signup)
  isSigningUp: boolean;
  setIsSigningUp: (isSigningUp: boolean) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;

  // Messages
  messages: { [conversationId: string]: DecryptedMessage[] };
  setMessages: (conversationId: string, messages: DecryptedMessage[]) => void;
  addMessage: (conversationId: string, message: DecryptedMessage) => void;

  // UI state
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Translation loading states
  translatingMessages: Set<string>;
  addTranslatingMessage: (messageId: string) => void;
  removeTranslatingMessage: (messageId: string) => void;

  // Notification settings
  notificationsEnabled: boolean;
  notificationSoundEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSoundEnabled: (enabled: boolean) => void;

  // Key recovery trigger
  keyRestoredAt: number;
  triggerKeyRestored: () => void;

  // Read notifications tracking (which conversation messages have been seen)
  readNotifications: Set<string>; // Set of messageIds that have been marked as read
  markConversationAsRead: (conversationId: string, messageIds: string[]) => void;
  clearReadNotifications: () => void;
}

export const useStore = create<AppState>((set) => ({
  // User state
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Password state
  userPassword: null,
  setUserPassword: (password) => set({ userPassword: password }),

  // Signup state
  isSigningUp: false,
  setIsSigningUp: (isSigningUp) => set({ isSigningUp }),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    })),

  // Messages
  messages: {},
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          message,
        ],
      },
    })),

  // UI state
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),

  theme: 'light',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
  setTheme: (theme) => set({ theme }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Translation loading states
  translatingMessages: new Set(),
  addTranslatingMessage: (messageId) => set((state) => {
    const newSet = new Set(state.translatingMessages);
    newSet.add(messageId);
    return { translatingMessages: newSet };
  }),
  removeTranslatingMessage: (messageId) => set((state) => {
    const newSet = new Set(state.translatingMessages);
    newSet.delete(messageId);
    return { translatingMessages: newSet };
  }),

  // Notification settings
  notificationsEnabled: typeof window !== 'undefined'
    ? localStorage.getItem('notificationsEnabled') !== 'false'
    : true,
  notificationSoundEnabled: typeof window !== 'undefined'
    ? localStorage.getItem('notificationSoundEnabled') !== 'false'
    : true,
  setNotificationsEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationsEnabled', String(enabled));
    }
    set({ notificationsEnabled: enabled });
  },
  setNotificationSoundEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSoundEnabled', String(enabled));
    }
    set({ notificationSoundEnabled: enabled });
  },

  // Key recovery trigger
  keyRestoredAt: 0,
  triggerKeyRestored: () => set({ keyRestoredAt: Date.now() }),

  // Read notifications tracking
  readNotifications: new Set(),
  markConversationAsRead: (conversationId, messageIds) => set((state) => {
    const newSet = new Set(state.readNotifications);
    messageIds.forEach(id => newSet.add(id));
    return { readNotifications: newSet };
  }),
  clearReadNotifications: () => set({ readNotifications: new Set() }),
}));
