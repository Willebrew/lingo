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
        const decrypted: DecryptedMessage[] = newMessages
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
              translated: msg.translated,
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
    if (!currentUser || !conversationId || !userPassword) return;

    const privateKey = await getPrivateKey(currentUser.id, userPassword);
    if (!privateKey) return;

    // Encrypt message for all participants
    const encryptedContent: { [recipientId: string]: string } = {};

    for (const participantId of conversation.participants) {
      const participantPublicKey = conversation.participantDetails[participantId].publicKey;
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
