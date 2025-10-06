import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  subscribeToMessages,
  sendMessage as dbSendMessage,
  getMessages,
  getConversation,
} from '@/lib/db';
import { encryptMessage, decryptMessage, getPrivateKey } from '@/utils/encryption';
import type { Message, DecryptedMessage, Conversation } from '@/types';

export function useMessages(conversationId: string | null) {
  const { currentUser, userPassword, messages, setMessages, addMessage } = useStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    getConversation(conversationId).then(setConversation);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUser || !conversation || !userPassword) return;

    let unsubscribe: (() => void) | undefined;

    const loadPrivateKey = async () => {
      const privateKey = await getPrivateKey(currentUser.id, userPassword);
      if (!privateKey) return;

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
            };
          })
          .filter((msg): msg is DecryptedMessage => msg !== null);

        setMessages(conversationId, decrypted);
      });
    };

    loadPrivateKey();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, currentUser, conversation, userPassword, setMessages]);

  const sendMessageToConversation = async (
    content: string,
    conversation: any
  ) => {
    console.log('[useMessages] Starting message send...', {
      hasCurrentUser: !!currentUser,
      hasConversationId: !!conversationId,
      hasUserPassword: !!userPassword,
      conversationId,
      participants: conversation?.participants
    });

    if (!currentUser || !conversationId || !userPassword) {
      console.error('[useMessages] Missing required data:', {
        hasCurrentUser: !!currentUser,
        hasConversationId: !!conversationId,
        hasUserPassword: !!userPassword
      });
      throw new Error('Missing required authentication data');
    }

    console.log('[useMessages] Getting private key...');
    const privateKey = await getPrivateKey(currentUser.id, userPassword);
    if (!privateKey) {
      console.error('[useMessages] Failed to get private key');
      throw new Error('Failed to decrypt private key');
    }

    try {
      console.log('[useMessages] Encrypting message for participants:', conversation.participants);
      // Encrypt message for all participants
      const encryptedContent: { [recipientId: string]: string } = {};

      for (const participantId of conversation.participants) {
        const participantPublicKey = conversation.participantDetails[participantId]?.publicKey;
        if (!participantPublicKey) {
          console.error('[useMessages] Missing public key for participant:', participantId);
          throw new Error(`Missing public key for participant ${participantId}`);
        }
        console.log(`[useMessages] Encrypting for participant ${participantId}...`);
        encryptedContent[participantId] = encryptMessage(
          content,
          participantPublicKey,
          privateKey
        );
      }

      console.log('[useMessages] Sending to Firestore...', {
        conversationId,
        senderId: currentUser.id,
        encryptedForParticipants: Object.keys(encryptedContent)
      });

      await dbSendMessage(
        conversationId,
        currentUser.id,
        currentUser.displayName,
        encryptedContent
      );

      console.log('[useMessages] Message sent successfully!');
    } catch (error) {
      console.error('[useMessages] Error sending message:', error);
      console.error('[useMessages] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  };

  const translateMessage = async (messageId: string, targetLanguage: string) => {
    if (!conversationId) return;

    const conversationMessages = messages[conversationId] || [];
    const message = conversationMessages.find((m) => m.id === messageId);

    if (!message) return;

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          targetLanguage,
        }),
      });

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
    }
  };

  return {
    messages: conversationId ? messages[conversationId] || [] : [],
    sendMessageToConversation,
    translateMessage,
  };
}
