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
      <div className="flex h-full items-center justify-center bg-transparent px-6 py-12">
        <div className="max-w-md rounded-[32px] border border-dashed border-white/50 bg-white/60 px-10 py-12 text-center shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-400/20 to-accent-400/20 text-primary-600 dark:text-primary-300">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-2xl font-display text-slate-900 dark:text-white">Select a conversation</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose a thread from the left to begin your encrypted chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/30 bg-white/70 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedConversationId(null)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-slate-500 transition hover:text-slate-900 lg:hidden dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/20 via-primary-400/25 to-accent-400/20 text-primary-600 shadow-inner dark:text-primary-300">
            {isGroupChat ? <Users className="h-5 w-5" /> : getConversationDisplayName().charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="font-display text-xl text-slate-900 dark:text-white">
              {getConversationDisplayName()}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary-500/80 dark:text-primary-300/80">
              <Lock className="h-3.5 w-3.5" />
              {isGroupChat ? `Group • ${conversation.participants.length} people` : 'End-to-end encrypted'}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-white/70 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-white/40 bg-white/85 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
            >
              <button
                onClick={() => {
                  setConversationName(conversation?.name || '');
                  setShowEditName(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <Edit3 className="h-4 w-4" />
                Rename conversation
              </button>
              <button
                onClick={() => {
                  setShowAddParticipant(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-primary-600 transition hover:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/15"
              >
                <UserPlus className="h-4 w-4" />
                Add participant
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete conversation
              </button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="pointer-events-none absolute inset-0 bg-soft-grid [background-size:22px_22px] opacity-40 dark:opacity-20" />
        <div className="relative space-y-4">
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
      </div>

      {/* Input */}
      <div className="border-t border-white/30 bg-white/70 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write something thoughtful…"
            className="flex-1 rounded-[24px] border border-white/50 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400 text-white shadow-lg">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Add participants</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Bring more people into this encrypted conversation.
                </p>
              </div>
            </div>

            {availableContacts.length === 0 ? (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/50 px-6 py-10 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
                  <Users className="mb-4 h-12 w-12 text-primary-400" />
                  <p className="font-semibold">Everyone is already here</p>
                  <p className="mt-2 text-sm text-slate-500/80 dark:text-slate-400/80">
                    All of your saved contacts are part of this conversation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddParticipant(false);
                    setSelectedContactId('');
                  }}
                  className="w-full rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Select contact
                  </label>
                  <div className="mt-2 relative">
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
                    >
                      <option value="">Choose a contact…</option>
                      {availableContacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.displayName} ({contact.email})
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedContactId('');
                    }}
                    className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddParticipant}
                    disabled={!selectedContactId || isAddingParticipant}
                    className="flex-1 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingParticipant ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400 text-white shadow-lg">
                <Edit3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Rename conversation</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Give this chat a name that makes it easy to find later.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Conversation name
              </label>
              <input
                type="text"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                placeholder="Leave blank to use participant names"
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
                autoFocus
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowEditName(false);
                  setConversationName('');
                }}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                className="flex-1 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
              >
                Save changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Delete this conversation?</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Everyone loses access to the history when you confirm.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50/90 p-5 text-sm leading-relaxed text-red-700 shadow-inner dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              <p className="font-semibold">⚠️ Heads up</p>
              <p className="mt-2">
                Deleting removes every encrypted message for all participants. There’s no undo—make sure the team is ready.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Keep history
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
              >
                Delete for everyone
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
