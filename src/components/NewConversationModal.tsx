'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';
import { useStore } from '@/store/useStore';
import { X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewConversationModalProps {
  onClose: () => void;
}

export default function NewConversationModal({ onClose }: NewConversationModalProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { contacts } = useContacts();
  const { setSelectedConversationId, currentUser } = useStore();

  const toggleContact = (contactId: string) => {
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContactIds.size === 0 || !currentUser) return;

    setLoading(true);

    try {
      const selectedContacts = contacts.filter(c => selectedContactIds.has(c.id));
      if (selectedContacts.length === 0) {
        toast.error('No contacts selected');
        return;
      }

      // Create conversation with all selected participants
      const { createConversation } = await import('@/lib/db');

      const participantIds = [currentUser.id, ...selectedContacts.map(c => c.id)];
      const participantDetails: any = {
        [currentUser.id]: {
          displayName: currentUser.displayName,
          publicKey: currentUser.publicKey,
        }
      };

      selectedContacts.forEach(contact => {
        participantDetails[contact.id] = {
          displayName: contact.displayName,
          publicKey: contact.publicKey,
        };
      });

      const conversationId = await createConversation(participantIds, participantDetails);

      setSelectedConversationId(conversationId);
      toast.success(selectedContacts.length === 1 ? 'Conversation started!' : 'Group chat created!');
      onClose();
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-[30px] border border-white/25 bg-white/90 p-8 shadow-[0_24px_60px_rgba(31,41,120,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-display text-slate-900 dark:text-white">New conversation</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select one or more contacts to start chatting together.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/70 text-slate-500 transition hover:border-primary-200 hover:text-slate-800 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/50 bg-white/40 px-6 py-12 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
              <Users className="mb-4 h-12 w-12 text-primary-400" />
              <p className="font-semibold">No contacts yet</p>
              <p className="mt-2 text-sm text-slate-500/80 dark:text-slate-400/80">
                Add a contact first to open a conversation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">
                  <span>Select contacts</span>
                  {selectedContactIds.size > 0 && (
                    <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
                      {selectedContactIds.size} selected
                    </span>
                  )}
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-[26px] border border-white/35 bg-white/70 p-2 shadow-inner scrollbar-thin dark:border-white/10 dark:bg-slate-900/60">
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-600 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-900/70"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="h-4 w-4 rounded border-white/40 text-primary-500 focus:ring-2 focus:ring-primary-400 dark:border-white/20"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-700 dark:text-slate-100">{contact.displayName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 truncate" title={contact.email}>{contact.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedContactIds.size === 0}
                className="w-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Creating…'
                  : selectedContactIds.size > 1
                  ? 'Create group chat'
                  : 'Start conversation'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
