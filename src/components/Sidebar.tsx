'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useTheme } from '@/hooks/useTheme';
import { MessageSquare, Plus, Moon, Sun, LogOut, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import NewConversationModal from './NewConversationModal';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { currentUser, selectedConversationId, setSelectedConversationId } = useStore();
  const { conversations } = useConversations();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNewConversation, setShowNewConversation] = useState(false);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success('Signed out successfully');
    }
  };

  const getOtherParticipantName = (conv: any) => {
    const otherParticipantId = conv.participants.find(
      (id: string) => id !== currentUser?.id
    );
    return conv.participantDetails[otherParticipantId]?.displayName || 'Unknown';
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-bold">Lingo</h1>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentUser?.email}
            </p>
          </div>

          <div className="flex gap-2 ml-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewConversation(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </motion.button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new conversation to get started</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {conversations.map((conv) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedConversationId(conv.id);
                  onClose?.();
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConversationId === conv.id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">
                    {getOtherParticipantName(conv)}
                  </p>
                  {conv.lastMessageAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true })}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {conv.lastMessage}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}
    </div>
  );
}
