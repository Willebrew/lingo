'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useTheme } from '@/hooks/useTheme';
import { MessageSquare, Plus, Moon, Sun, LogOut, X, Users, User, Trash2, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import NewConversationModal from './NewConversationModal';
import Image from 'next/image';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { currentUser, selectedConversationId, setSelectedConversationId } = useStore();
  const { conversations } = useConversations();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { deleteConversation } = useConversations();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('messages');
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingConvId(convId);
  };

  const confirmDelete = async () => {
    if (!deletingConvId) return;
    const result = await deleteConversation(deletingConvId);
    if (result.success) {
      toast.success('Conversation deleted');
      setDeletingConvId(null);
    } else {
      toast.error('Failed to delete conversation');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);

      console.log('[Sidebar] Starting account deletion...');
      const { auth, db } = await import('@/lib/firebase');
      const { doc, deleteDoc, updateDoc, arrayRemove } = await import('firebase/firestore');
      const { deleteUser } = await import('firebase/auth');

      // Handle conversations: remove user from participants or delete if they're the only one
      console.log('[Sidebar] Processing conversations...');
      for (const conv of conversations) {
        if (conv.participants.length === 1) {
          // User is the only participant - delete the conversation
          console.log(`[Sidebar] Deleting conversation ${conv.id} (user is only participant)`);
          await deleteConversation(conv.id);
        } else if (conv.participants.length === 2) {
          // If removing this user would leave only 1 person, delete the conversation
          // (1-person conversations don't make sense)
          console.log(`[Sidebar] Deleting conversation ${conv.id} (would leave only 1 participant)`);
          await deleteConversation(conv.id);
        } else {
          // Multiple participants remain - just remove this user from the conversation
          console.log(`[Sidebar] Removing user from conversation ${conv.id}`);
          await updateDoc(doc(db, 'conversations', conv.id), {
            participants: arrayRemove(currentUser.id),
            [`participantDetails.${currentUser.id}`]: null
          });
        }
      }

      // Note: We don't delete messages sent by this user because:
      // 1. Firestore rules don't allow querying all messages by sender
      // 2. Other users should still see the conversation history
      // 3. Messages will just show as sent by a deleted user
      console.log('[Sidebar] Skipping message deletion (preserving chat history)...');

      // Delete user document from Firestore
      console.log('[Sidebar] Deleting user document from Firestore...');
      await deleteDoc(doc(db, 'users', currentUser.id));

      // Delete user from Firebase Auth
      console.log('[Sidebar] Deleting user from Firebase Auth...');
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      toast.success('Account deleted successfully');
      setShowDeleteAccount(false);
      // User will be automatically signed out when auth user is deleted
    } catch (error: any) {
      console.error('Error deleting account:', error);

      // Handle re-authentication required error
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign back in, then try deleting your account again.');
      } else {
        toast.error('Failed to delete account: ' + (error.message || 'Unknown error'));
      }
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Lingo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-xl font-bold">Lingo</h1>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {currentUser?.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex gap-1 ml-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setShowDeleteAccount(true)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
              title="Delete account"
            >
              <UserX className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">Messages</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'contacts'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="font-medium">Contacts</span>
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'messages' && (
          <>
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Start a new conversation to get started</p>
              </div>
            ) : (
              <div className="px-2">
                {conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        onClose?.();
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                        selectedConversationId === conv.id
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getOtherParticipantName(conv).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {getOtherParticipantName(conv)}
                            </p>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true }).replace('about ', '')}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'contacts' && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Contacts feature coming soon</p>
            <p className="text-xs mt-1">You&apos;ll be able to manage contacts here</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}

      {/* Delete Conversation Confirmation */}
      {deletingConvId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Delete Conversation?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will delete the conversation for all participants. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingConvId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Account?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action is permanent</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>⚠️ Warning:</strong> This will permanently delete your account, all conversations, and encrypted messages. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
