import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import {
  subscribeToMessages,
  getConversation,
} from '@/lib/db';
import { decryptMessage, getPrivateKey } from '@/utils/encryption';
import { useNotifications } from './useNotifications';
import type { DecryptedMessage, Conversation } from '@/types';

/**
 * Hook that loads messages from ALL conversations for notifications
 */
export function useAllMessages() {
  const { currentUser, userPassword, conversations, setMessages, keyRestoredAt } = useStore();
  const { notifyNewMessage } = useNotifications();
  const previousMessageIds = useRef<Set<string>>(new Set());
  const unsubscribers = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!currentUser || !userPassword || conversations.length === 0) return;

    const loadMessagesForConversation = async (conversationId: string) => {
      try {
        const conversation = await getConversation(conversationId);
        if (!conversation) return;

        const privateKey = await getPrivateKey(currentUser.id, userPassword, true);
        if (!privateKey) return;

        // Clean up existing subscription for this conversation
        const existingUnsub = unsubscribers.current.get(conversationId);
        if (existingUnsub) {
          existingUnsub();
        }

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
          const decrypted = newMessages
            .map((msg) => {
              const encryptedForMe = msg.encryptedContent[currentUser.id];
              if (!encryptedForMe) return null;

              const senderPublicKey = conversation.participantDetails[msg.senderId]?.publicKey;
              if (!senderPublicKey) return null;

              const content = decryptMessage(
                encryptedForMe,
                senderPublicKey,
                privateKey
              );

              if (!content) return null;

              return {
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content,
                timestamp: msg.timestamp,
                ...(msg.translated !== undefined && { translated: msg.translated }),
                ...(msg.isSystemMessage && { isSystemMessage: true }),
              } as DecryptedMessage;
            })
            .filter((msg): msg is DecryptedMessage => msg !== null);

          // Check for new messages from other users and send notifications
          decrypted.forEach((msg) => {
            if (!previousMessageIds.current.has(msg.id) && msg.senderId !== currentUser.id && !msg.isSystemMessage) {
              notifyNewMessage(msg.senderName, msg.content);
            }
          });

          // Update tracked message IDs
          decrypted.forEach(msg => previousMessageIds.current.add(msg.id));

          setMessages(conversationId, decrypted);
        });

        unsubscribers.current.set(conversationId, unsubscribe);
      } catch (error) {
        console.error(`Failed to load messages for conversation ${conversationId}:`, error);
      }
    };

    // Load messages for all conversations
    conversations.forEach((conv) => {
      loadMessagesForConversation(conv.id);
    });

    return () => {
      // Clean up all subscriptions
      unsubscribers.current.forEach((unsub) => unsub());
      unsubscribers.current.clear();
    };
  }, [currentUser, userPassword, conversations, setMessages, notifyNewMessage, keyRestoredAt]);
}
