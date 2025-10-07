'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';
import { Send, Lock, Trash2, MoreVertical, Menu, UserPlus, Users, Edit3, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import KeyRecoveryModal from './KeyRecoveryModal';
import { getConversation, addParticipantToConversation } from '@/lib/db';
import { getPrivateKey } from '@/utils/encryption';
import type { Conversation } from '@/types';
import toast from 'react-hot-toast';

export default function ChatView() {
  const { selectedConversationId, setSelectedConversationId, currentUser, userPassword, markConversationAsRead } = useStore();
  const [messageText, setMessageText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showKeyRecovery, setShowKeyRecovery] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [conversationName, setConversationName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { messages, sendMessageToConversation } = useMessages(selectedConversationId);
  const { deleteConversation } = useConversations();
  const { contacts } = useContacts();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversation(null);
      return;
    }

    // Set up real-time listener for conversation
    const setupListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const unsubscribe = onSnapshot(
        doc(db, 'conversations', selectedConversationId),
        (snapshot) => {
          if (!snapshot.exists()) {
            // Conversation was deleted
            console.log('[ChatView] Conversation deleted, clearing selection');
            setConversation(null);
            setSelectedConversationId(null);
            toast.error('This conversation has been deleted');
          } else {
            setConversation({ id: snapshot.id, ...snapshot.data() } as Conversation);
          }
        },
        (error) => {
          console.error('[ChatView] Error listening to conversation:', error);
        }
      );

      return unsubscribe;
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then(unsubscribe => unsubscribe?.());
    };
  }, [selectedConversationId, setSelectedConversationId]);

  // Check if private key exists
  useEffect(() => {
    const checkPrivateKey = async () => {
      if (currentUser && userPassword) {
        const privateKey = await getPrivateKey(currentUser.id, userPassword, true);
        if (!privateKey) {
          setShowKeyRecovery(true);
        }
      }
    };
    checkPrivateKey();
  }, [currentUser, userPassword]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (selectedConversationId && messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      markConversationAsRead(selectedConversationId, messageIds);
    }
  }, [selectedConversationId, messages, markConversationAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversation || isSending) return;

    setIsSending(true);
    const messageToSend = messageText;
    setMessageText(''); // Clear immediately for better UX

    try {
      await sendMessageToConversation(messageToSend, conversation);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setMessageText(messageToSend); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const getConversationDisplayName = () => {
    if (!conversation || !currentUser) return 'Unknown';

    // Use custom name if it exists
    if (conversation.name) return conversation.name;

    const otherParticipants = conversation.participants.filter(id => id !== currentUser.id);

    if (otherParticipants.length === 0) return 'Unknown';
    if (otherParticipants.length === 1) {
      return conversation.participantDetails[otherParticipants[0]]?.displayName || 'Unknown';
    }

    // For group chats without custom name, show all names
    return otherParticipants.map(id =>
      conversation.participantDetails[id]?.displayName || 'Unknown'
    ).join(', ');
  };

  const isGroupChat = conversation && conversation.participants.length > 2;

  const availableContacts = contacts.filter(contact =>
    conversation && !conversation.participants.includes(contact.id)
  );

  const handleAddParticipant = async () => {
    if (!selectedContactId || !conversation || !currentUser) return;

    setIsAddingParticipant(true);
    try {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (!contact) {
        toast.error('Contact not found');
        return;
      }

      await addParticipantToConversation(conversation.id, contact.id, contact.displayName, contact.publicKey);

      // Refresh conversation
      const updatedConv = await getConversation(conversation.id);
      setConversation(updatedConv);

      toast.success(`Added ${contact.displayName} to the conversation`);
      setShowAddParticipant(false);
      setSelectedContactId('');
    } catch (error: any) {
      console.error('Failed to add participant:', error);
      toast.error(error.message || 'Failed to add participant');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;

    const result = await deleteConversation(selectedConversationId);
    if (result.success) {
      toast.success('Conversation deleted for all participants');
      setShowDeleteConfirm(false);
    } else {
      toast.error('Failed to delete conversation');
    }
  };

  const handleUpdateName = async () => {
    if (!conversation || !conversation.id || !currentUser || !userPassword) {
      toast.error('Invalid conversation');
      return;
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const newName = conversationName.trim();

      await updateDoc(doc(db, 'conversations', conversation.id), {
        name: newName || null,
      });

      // Send system message about name change
      const systemMessage = newName
        ? `The name was changed to "${newName}"`
        : `The conversation name was removed`;

      const privateKey = await getPrivateKey(currentUser.id, userPassword, true);
      if (privateKey) {
        const { encryptMessage } = await import('@/utils/encryption');
        const { sendMessage } = await import('@/lib/db');

        // Encrypt system message for all participants
        const encryptedContent: { [recipientId: string]: string } = {};
        for (const participantId of conversation.participants) {
          const participantPublicKey = conversation.participantDetails[participantId]?.publicKey;
          if (participantPublicKey) {
            encryptedContent[participantId] = encryptMessage(
              systemMessage,
              participantPublicKey,
              privateKey
            );
          }
        }

        await sendMessage(
          conversation.id,
          currentUser.id,
          currentUser.displayName,
          encryptedContent,
          true // isSystemMessage
        );
      }

      // Update local state
      const updatedConv = await getConversation(conversation.id);
      setConversation(updatedConv);

      toast.success('Conversation name updated');
      setShowEditName(false);
    } catch (error: any) {
      console.error('Failed to update conversation name:', error);
      toast.error('Failed to update name');
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedConversationId(null)}
              className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {isGroupChat ? <Users className="w-5 h-5" /> : getConversationDisplayName().charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold">{getConversationDisplayName()}</h2>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {isGroupChat ? `Group chat • ${conversation.participants.length} participants` : 'End-to-end encrypted'}
              </p>
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] z-10"
              >
                <button
                  onClick={() => {
                    setConversationName(conversation?.name || '');
                    setShowEditName(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Name
                </button>
                <button
                  onClick={() => {
                    setShowAddParticipant(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Participant
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Conversation
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
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
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Key Recovery Modal */}
      {showKeyRecovery && (
        <KeyRecoveryModal
          onSuccess={() => {
            setShowKeyRecovery(false);
            toast.success('Encryption keys restored! You can now send messages.');
          }}
        />
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Add Participant</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add someone from your contacts
                </p>
              </div>
            </div>

            {availableContacts.length === 0 ? (
              <div>
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">All your contacts are already in this conversation</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddParticipant(false);
                    setSelectedContactId('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Contact</label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="">Choose a contact...</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.displayName} ({contact.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedContactId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddParticipant}
                    disabled={!selectedContactId || isAddingParticipant}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingParticipant ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Edit Conversation Name</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set a custom name for this conversation
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Conversation Name</label>
              <input
                type="text"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                placeholder="Leave empty to use participant names"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditName(false);
                  setConversationName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Conversation?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>⚠️ Warning:</strong> This will delete the conversation and all messages
                <strong> for all participants</strong>. Everyone in this conversation will lose access to these messages.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete for Everyone
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
