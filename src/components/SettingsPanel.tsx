'use client';

import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Bell, Moon, Sun, Volume2, VolumeX, UserX, LogOut } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useConversations } from '@/hooks/useConversations';

export default function SettingsPanel() {
  const {
    currentUser,
    notificationsEnabled,
    notificationSoundEnabled,
    setNotificationsEnabled,
    setNotificationSoundEnabled,
  } = useStore();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { conversations, deleteConversation } = useConversations();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success('Signed out successfully');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);

      console.log('[SettingsPanel] Starting account deletion...');
      const { auth, db } = await import('@/lib/firebase');
      const { doc, deleteDoc, updateDoc, arrayRemove } = await import('firebase/firestore');
      const { deleteUser } = await import('firebase/auth');

      console.log('[SettingsPanel] Checking auth...');
      if (!auth.currentUser) {
        throw new Error('Not authenticated');
      }

      // Check if re-authentication is needed
      const metadata = auth.currentUser.metadata;
      const lastSignInTime = metadata.lastSignInTime ? new Date(metadata.lastSignInTime).getTime() : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - lastSignInTime > fiveMinutes) {
        console.log('[SettingsPanel] Recent login required');
        toast.error('For security, please sign out and sign back in, then try deleting your account again.');
        setIsDeleting(false);
        return;
      }

      // Clean up conversations
      console.log('[SettingsPanel] Processing conversations...');
      for (const conv of conversations) {
        if (conv.participants.length === 1) {
          console.log(`[SettingsPanel] Deleting conversation ${conv.id}`);
          await deleteConversation(conv.id);
        } else if (conv.participants.length === 2) {
          console.log(`[SettingsPanel] Deleting conversation ${conv.id}`);
          await deleteConversation(conv.id);
        } else {
          console.log(`[SettingsPanel] Removing user from conversation ${conv.id}`);
          await updateDoc(doc(db, 'conversations', conv.id), {
            participants: arrayRemove(currentUser.id),
            [`participantDetails.${currentUser.id}`]: null
          });
        }
      }

      // Delete user document from Firestore
      console.log('[SettingsPanel] Deleting user document...');
      await deleteDoc(doc(db, 'users', currentUser.id));

      // Delete user from Firebase Auth
      console.log('[SettingsPanel] Deleting auth user...');
      await deleteUser(auth.currentUser);

      console.log('[SettingsPanel] Account deletion complete');
      toast.success('Account deleted successfully');
      setShowDeleteAccount(false);
    } catch (error: any) {
      console.error('Error deleting account:', error);

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
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your preferences and account
        </p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Appearance
          </h3>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {theme === 'light' ? 'Light mode' : 'Dark mode'}
                </p>
              </div>
            </div>
            <div className="text-sm text-primary-500 font-medium">Toggle</div>
          </button>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Notifications
          </h3>
          <div className="space-y-3">
            {/* Enable/Disable Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Desktop Notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show notifications for new messages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ left: notificationsEnabled ? '26px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Enable/Disable Sound */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                {notificationSoundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notification Sound
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Play sound with notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationSoundEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ left: notificationSoundEnabled ? '26px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Account
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Sign Out</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sign out of your account
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteAccount(true)}
              className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
            >
              <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-red-500 dark:text-red-400/80">
                  Permanently delete your account
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Account Information
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {currentUser?.displayName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {currentUser?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
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
