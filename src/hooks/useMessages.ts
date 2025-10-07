import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import {
  subscribeToMessages,
  sendMessage as dbSendMessage,
  getMessages,
  getConversation,
} from '@/lib/db';
import { encryptMessage, decryptMessage, getPrivateKey } from '@/utils/encryption';
import { useNotifications } from './useNotifications';
import type { Message, DecryptedMessage, Conversation } from '@/types';

export function useMessages(conversationId: string | null) {
  const { currentUser, userPassword, messages, setMessages, addMessage, addTranslatingMessage, removeTranslatingMessage, keyRestoredAt } = useStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const { notifyNewMessage } = useNotifications();
  const previousMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;
    getConversation(conversationId).then(setConversation);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUser || !conversation || !userPassword) return;

    let unsubscribe: (() => void) | undefined;

    const loadPrivateKey = async () => {
      const privateKey = await getPrivateKey(currentUser.id, userPassword, true);
      if (!privateKey) {
        // Key is missing or corrupted - clean it up
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`lingo_pk_${currentUser.id}`);
        }
        return;
      }

      unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
        const decrypted = newMessages
          .map((msg) => {
            const encryptedForMe = msg.encryptedContent[currentUser.id];
            if (!encryptedForMe) return null;

            // Get sender's public key from conversation details
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
            };
          })
          .filter((msg): msg is DecryptedMessage => msg !== null);

        // Check for new messages from other users and send notifications
        decrypted.forEach((msg) => {
          if (!previousMessageIds.current.has(msg.id) && msg.senderId !== currentUser.id && !msg.isSystemMessage) {
            notifyNewMessage(msg.senderName, msg.content);
          }
        });

        // Update tracked message IDs
        previousMessageIds.current = new Set(decrypted.map(m => m.id));

        setMessages(conversationId, decrypted);
      });
    };

    loadPrivateKey();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, currentUser, conversation, userPassword, setMessages, notifyNewMessage, keyRestoredAt]);

  const sendMessageToConversation = async (
    content: string,
    conversation: any
  ) => {
    if (!currentUser || !conversationId || !userPassword) {
      throw new Error('Missing required authentication data');
    }

    const privateKey = await getPrivateKey(currentUser.id, userPassword, true);
    if (!privateKey) {
      // Key is missing or corrupted - clean it up
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`lingo_pk_${currentUser.id}`);
      }
      throw new Error('Failed to decrypt private key. Please restore your encryption keys.');
    }

    try {
      // Encrypt message for all participants
      const encryptedContent: { [recipientId: string]: string } = {};

      for (const participantId of conversation.participants) {
        const participantPublicKey = conversation.participantDetails[participantId]?.publicKey;
        if (!participantPublicKey) {
          throw new Error(`Missing public key for participant ${participantId}`);
        }
        encryptedContent[participantId] = encryptMessage(
          content,
          participantPublicKey,
          privateKey
        );
      }

      await dbSendMessage(
        conversationId,
        currentUser.id,
        currentUser.displayName,
        encryptedContent
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const translateMessage = async (messageId: string, targetLanguage: string) => {
    if (!conversationId || !currentUser) return;

    const conversationMessages = messages[conversationId] || [];
    const message = conversationMessages.find((m) => m.id === messageId);

    if (!message) return;

    // Mark message as translating
    addTranslatingMessage(messageId);

    try {
      // Get Firebase Auth token
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: message.content,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const data = await response.json();

      if (data.translatedText) {
        // Update message with translation
        const updatedMessages = conversationMessages.map((m) =>
          m.id === messageId
            ? { ...m, content: data.translatedText, translated: true }
            : m
        );
        setMessages(conversationId, updatedMessages);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Show error to user
      const toast = (await import('react-hot-toast')).default;
      toast.error(error instanceof Error ? error.message : 'Translation failed');
    } finally {
      // Remove from translating state
      removeTranslatingMessage(messageId);
    }
  };

  return {
    messages: conversationId ? messages[conversationId] || [] : [],
    sendMessageToConversation,
    translateMessage,
  };
}
