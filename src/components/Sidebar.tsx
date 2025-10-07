'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';
import { findOrCreateConversation } from '@/lib/db';
import { MessageSquare, Plus, Users, Trash2, UserPlus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import NewConversationModal from './NewConversationModal';
import type { Conversation } from '@/types';

interface SidebarProps {
  onClose?: () => void;
  initialTab?: 'messages' | 'contacts';
}

export default function Sidebar({ onClose, initialTab = 'messages' }: SidebarProps) {
  const { currentUser, selectedConversationId, setSelectedConversationId } = useStore();
  const { conversations, deleteConversation } = useConversations();
  const { contacts, addContact, removeContact } = useContacts();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [addingContact, setAddingContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getConversationName = (conv: Conversation) => {
    // If conversation has a custom name, use it
    if (conv.name) {
      return conv.name;
    }

    // Otherwise, show participant names
    const otherParticipants = conv.participants.filter(
      (id: string) => id !== currentUser?.id
    );

    if (otherParticipants.length === 0) return 'Unknown';
    if (otherParticipants.length === 1) {
      return conv.participantDetails[otherParticipants[0]]?.displayName || 'Unknown';
    }

    // For group chats, show first 2 names + count
    const names = otherParticipants
      .slice(0, 2)
      .map((id: string) => conv.participantDetails[id]?.displayName || 'Unknown');

    if (otherParticipants.length > 2) {
      return `${names.join(', ')} +${otherParticipants.length - 2}`;
    }

    return names.join(', ');
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingConvId(convId);
  };

  const confirmDelete = async () => {
    if (!deletingConvId || isDeletingConversation) return;

    setIsDeletingConversation(true);
    try {
      const result = await deleteConversation(deletingConvId);
      if (result.success) {
        toast.success('Conversation deleted');
        if (selectedConversationId === deletingConvId) {
          setSelectedConversationId(null);
        }
        setDeletingConvId(null);
      } else {
        toast.error('Failed to delete conversation');
      }
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactEmail.trim()) return;

    setAddingContact(true);
    const result = await addContact(contactEmail.trim());

    if (result.success) {
      toast.success(`Added ${result.user?.displayName} to contacts`);
      setContactEmail('');
      setShowAddContact(false);
    } else {
      toast.error(result.error || 'Failed to add contact');
    }
    setAddingContact(false);
  };

  const handleRemoveContact = async (contactId: string, contactName: string) => {
    const result = await removeContact(contactId);

    if (result.success) {
      toast.success(`Removed ${contactName} from contacts`);
    } else {
      toast.error(result.error || 'Failed to remove contact');
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter((conv: Conversation) =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewingContacts = initialTab === 'contacts';
  const headerTitle = viewingContacts ? 'Your contacts' : 'Your spaces';
  const headerLabel = viewingContacts ? 'Directory' : 'Inbox';
  const searchPlaceholder = viewingContacts ? 'Search contacts' : 'Search conversations';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-6 pt-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-300">{headerLabel}</p>
            <h2 className="mt-3 text-2xl font-display text-slate-900 dark:text-white">{headerTitle}</h2>
          </div>
          <button
            onClick={() => setShowNewConversation(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 focus:ring-primary-300/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start chat
            </span>
            <span className="absolute inset-0 translate-y-full bg-white/25 transition-transform duration-300 ease-out group-hover:translate-y-0" />
          </button>
        </div>
      </div>

      <div className="px-6 pb-4 pt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/40 bg-white/80 py-3 pl-11 pr-5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 scrollbar-thin">
        {!viewingContacts ? (
          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-white/50 bg-white/40 px-6 py-12 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
                <MessageSquare className="mb-4 h-12 w-12 text-primary-400" />
                <p className="font-semibold">No conversations yet</p>
                <p className="mt-1 text-sm text-slate-500/80 dark:text-slate-400/80">Start a new conversation to get going.</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-white/50 bg-white/40 px-6 py-10 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
                <Search className="mb-4 h-10 w-10 text-primary-400" />
                <p className="font-semibold">No matches</p>
                <p className="mt-1 text-sm text-slate-500/80 dark:text-slate-400/80">Try a different keyword.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                  const isSelected = selectedConversationId === conv.id;
                  return (
                    <div key={conv.id} className="group relative">
                      <button
                        onClick={() => {
                          setSelectedConversationId(conv.id);
                          onClose?.();
                        }}
                        className={`relative flex w-full items-start gap-4 overflow-hidden rounded-[28px] border px-5 py-4 pr-16 text-left shadow-sm transition ${
                          isSelected
                            ? 'border-primary-400/50 bg-primary-500/10 shadow-lg ring-1 ring-primary-500/30 dark:border-primary-400/30 dark:bg-primary-900/20'
                            : 'border-transparent bg-white/60 hover:border-white/60 hover:bg-white/80 dark:bg-slate-950/40 dark:hover:border-white/10 dark:hover:bg-slate-950/60'
                        }`}
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/30 text-base font-semibold text-primary-600 dark:text-primary-300">
                          {getConversationName(conv).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-start flex-col gap-1">
                            <p className="font-display text-base text-slate-900 dark:text-white">
                              {getConversationName(conv)}
                            </p>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-slate-400 dark:text-slate-400">
                                {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true }).replace('about ', '')}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-300">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white/90 text-red-500 opacity-100 shadow-sm transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-300">
              <span>Your contacts</span>
              <button
                onClick={() => setShowAddContact(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-[11px] font-semibold text-primary-600 transition hover:bg-primary-500/10 dark:border-white/10 dark:bg-slate-900/60 dark:text-primary-200"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-white/50 bg-white/40 px-6 py-12 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
                <Users className="mb-4 h-12 w-12 text-accent-400" />
                <p className="font-semibold">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </p>
                <p className="mt-1 text-sm text-slate-500/80 dark:text-slate-400/80">
                  {searchQuery ? 'Try another search term.' : 'Add contacts to start sharing moments.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="group relative overflow-hidden rounded-[28px] border border-transparent bg-white/60 p-4 text-center shadow-sm transition hover:border-white/60 hover:bg-white/80 dark:bg-slate-950/40 dark:hover:border-white/10 dark:hover:bg-slate-950/60">
                    <button
                      onClick={async () => {
                        if (!currentUser) return;
                        try {
                          const convId = await findOrCreateConversation(currentUser.id, contact.id);
                          setSelectedConversationId(convId);
                          onClose?.();
                        } catch (error) {
                          console.error('Failed to start conversation:', error);
                          toast.error('Failed to start conversation');
                        }
                      }}
                      className="flex w-full flex-col items-center gap-3"
                    >
                      <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400/30 to-primary-500/30 text-lg font-bold text-primary-600 shadow-sm dark:text-primary-200">
                          {contact.displayName.charAt(0).toUpperCase()}
                        </div>
                        {contact.status === 'online' && (
                          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-sm dark:border-slate-950" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm text-slate-900 dark:text-white">
                          {contact.displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 truncate" title={contact.email}>
                          {contact.email}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveContact(contact.id, contact.displayName);
                      }}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-white/80 text-red-500 opacity-0 shadow-sm transition hover:bg-red-50 group-hover:opacity-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                      title="Remove contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}

      {/* Delete Conversation Confirmation */}
      {deletingConvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-[26px] border border-white/30 bg-white/85 p-7 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-display text-slate-900 dark:text-white">Delete conversation?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This removes messages for everyone in the thread.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-sm text-red-700 shadow-inner dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              <p>
                <strong>Heads up:</strong> This action is permanent. Once deleted, no one will be able to recover this history.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingConvId(null)}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeletingConversation}
                className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeletingConversation ? 'Deleting…' : 'Delete for everyone'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
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
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Add a contact</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Invite teammates or friends by email.</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Email address
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addingContact) {
                    handleAddContact();
                  }
                }}
                placeholder="friend@example.com"
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
                autoFocus
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setContactEmail('');
                }}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!contactEmail.trim() || addingContact}
                className="flex-1 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {addingContact ? 'Adding…' : 'Add contact'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
