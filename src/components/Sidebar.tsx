'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';
import { useTheme } from '@/hooks/useTheme';
import { findOrCreateConversation } from '@/lib/db';
import { MessageSquare, Plus, X, Users, User, Trash2, UserPlus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import NewConversationModal from './NewConversationModal';
import Image from 'next/image';

interface SidebarProps {
  onClose?: () => void;
  initialTab?: 'messages' | 'contacts';
}

export default function Sidebar({ onClose, initialTab = 'messages' }: SidebarProps) {
  const { currentUser, selectedConversationId, setSelectedConversationId } = useStore();
  const { conversations } = useConversations();
  const { contacts, addContact, removeContact } = useContacts();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { deleteConversation } = useConversations();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>(initialTab);

  // Sync activeTab with initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [addingContact, setAddingContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success('Signed out successfully');
    }
  };

  const getConversationName = (conv: any) => {
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
      const { deleteUser, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider } = await import('firebase/auth');

      console.log('[Sidebar] Checking auth...');
      if (!auth.currentUser) {
        throw new Error('Not authenticated');
      }

      // Step 0: Test if we can delete auth user WITHOUT actually deleting it
      // We do this by checking the token age
      console.log('[Sidebar] Checking if re-authentication is needed...');
      const metadata = auth.currentUser.metadata;
      const lastSignInTime = metadata.lastSignInTime ? new Date(metadata.lastSignInTime).getTime() : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // If last sign-in was more than 5 minutes ago, require re-auth
      if (now - lastSignInTime > fiveMinutes) {
        console.log('[Sidebar] Recent login required (last sign-in was too long ago)');
        toast.error('For security, please sign out and sign back in, then try deleting your account again.');
        setIsDeleting(false);
        return;
      }

      // Step 1: Clean up conversations while we still have auth
      console.log('[Sidebar] Processing conversations...');
      for (const conv of conversations) {
        if (conv.participants.length === 1) {
          console.log(`[Sidebar] Deleting conversation ${conv.id} (user is only participant)`);
          await deleteConversation(conv.id);
        } else if (conv.participants.length === 2) {
          console.log(`[Sidebar] Deleting conversation ${conv.id} (would leave only 1 participant)`);
          await deleteConversation(conv.id);
        } else {
          console.log(`[Sidebar] Removing user from conversation ${conv.id}`);
          await updateDoc(doc(db, 'conversations', conv.id), {
            participants: arrayRemove(currentUser.id),
            [`participantDetails.${currentUser.id}`]: null
          });
        }
      }

      // Step 2: Delete user document from Firestore (while we still have auth)
      console.log('[Sidebar] Deleting user document from Firestore...');
      await deleteDoc(doc(db, 'users', currentUser.id));

      // Step 3: Delete user from Firebase Auth (do this last)
      console.log('[Sidebar] Deleting user from Firebase Auth...');
      await deleteUser(auth.currentUser);

      console.log('[Sidebar] Account deletion complete');
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

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
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

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations or contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content - Conditionally render based on active tab */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'messages' ? (
          /* Conversations View */
          <div>
            {conversations.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
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
                      className={`w-full p-3 pr-12 rounded-lg text-left transition-colors mb-1 ${
                        selectedConversationId === conv.id
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getConversationName(conv).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate mb-1">
                            {getConversationName(conv)}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">
                              {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true }).replace('about ', '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Contacts View */
          <div>
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Contacts
              </h3>
              <button
                onClick={() => setShowAddContact(true)}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Contact
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add contacts to start chatting'}
                </p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-2 gap-3">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="group relative">
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
                      className="w-full flex flex-col items-center p-3 rounded-xl text-center transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <div className="relative mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm">
                          {contact.displayName.charAt(0).toUpperCase()}
                        </div>
                        {contact.status === 'online' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        )}
                      </div>
                      <p className="font-semibold text-sm truncate w-full text-gray-900 dark:text-gray-100">
                        {contact.displayName}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate w-full">
                        {contact.email}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveContact(contact.id, contact.displayName);
                      }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shadow-sm transition-all"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
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

      {/* Add Contact Modal */}
      {showAddContact && (
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
                <h3 className="text-lg font-bold">Add Contact</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add someone by their email</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email Address</label>
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
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setContactEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                disabled={!contactEmail.trim() || addingContact}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingContact ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
