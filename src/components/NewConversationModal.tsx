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
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">New Conversation</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-1">No contacts yet</p>
              <p className="text-xs">Add a contact first to start a conversation</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Contacts {selectedContactIds.size > 0 && `(${selectedContactIds.size} selected)`}
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{contact.displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedContactIds.size === 0}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : selectedContactIds.size > 1 ? 'Create Group Chat' : 'Start Conversation'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
