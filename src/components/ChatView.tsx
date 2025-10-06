'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useMessages } from '@/hooks/useMessages';
import { Send, Lock } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { getConversation } from '@/lib/db';
import type { Conversation } from '@/types';

export default function ChatView() {
  const { selectedConversationId, currentUser } = useStore();
  const [messageText, setMessageText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const { messages, sendMessageToConversation } = useMessages(selectedConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversationId) {
      getConversation(selectedConversationId).then(setConversation);
    } else {
      setConversation(null);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation) return;

    await sendMessageToConversation(messageText, conversation);
    setMessageText('');
  };

  const getOtherParticipantName = () => {
    if (!conversation || !currentUser) return 'Unknown';
    const otherParticipantId = conversation.participants.find(
      (id) => id !== currentUser.id
    );
    return conversation.participantDetails[otherParticipantId!]?.displayName || 'Unknown';
  };

  if (!selectedConversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No conversation selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getOtherParticipantName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{getOtherParticipantName()}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              End-to-end encrypted
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser?.id}
              index={index}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
