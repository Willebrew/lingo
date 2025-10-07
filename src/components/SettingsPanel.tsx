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
    <div className="flex h-full flex-col">
      <div className="border-b border-white/30 px-6 py-6 dark:border-white/10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Preferences</p>
        <h2 className="mt-3 text-2xl font-display text-slate-900 dark:text-white">Settings</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Tailor Lingo to the way you like to work and stay in control of your account.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Appearance</h3>
          <button
            onClick={toggleTheme}
            className="mt-3 flex w-full items-center justify-between rounded-3xl border border-white/40 bg-white/80 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:shadow-lg hover:shadow-primary-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-950/70"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-400/20 to-accent-400/20 text-primary-600 dark:text-primary-300">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-display text-lg text-slate-900 dark:text-white">Theme</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
              </div>
            </div>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-300">
              Toggle
            </span>
          </button>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Notifications</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-3xl border border-white/40 bg-white/80 px-5 py-4 shadow-sm transition hover:border-white/60 dark:border-white/10 dark:bg-slate-950/70">
              <div className="flex flex-1 items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 dark:text-primary-300">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base text-slate-900 dark:text-white">Desktop notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Surface new messages instantly on your desktop.</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative flex h-7 w-14 items-center rounded-full transition ${
                  notificationsEnabled
                    ? 'bg-gradient-to-r from-primary-600 to-accent-500'
                    : 'bg-white/60 dark:bg-slate-700'
                }`}
              >
                <motion.span
                  className="absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-lg"
                  animate={{ x: notificationsEnabled ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-white/40 bg-white/80 px-5 py-4 shadow-sm transition hover:border-white/60 dark:border-white/10 dark:bg-slate-950/70">
              <div className="flex flex-1 items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 dark:text-primary-300">
                  {notificationSoundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-display text-base text-slate-900 dark:text-white">Notification sound</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Play a gentle chime whenever a new message arrives.</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                className={`relative flex h-7 w-14 items-center rounded-full transition ${
                  notificationSoundEnabled
                    ? 'bg-gradient-to-r from-primary-600 to-accent-500'
                    : 'bg-white/60 dark:bg-slate-700'
                }`}
              >
                <motion.span
                  className="absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-lg"
                  animate={{ x: notificationSoundEnabled ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Account</h3>
          <div className="mt-3 space-y-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-between rounded-3xl border border-white/40 bg-white/80 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:shadow-lg hover:shadow-primary-500/10 focus:outline-none dark:border-white/10 dark:bg-slate-950/70"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 dark:text-primary-300">
                  <LogOut className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base text-slate-900 dark:text-white">Sign out</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sign out on this device and keep your keys local.</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500/80 dark:text-primary-300/80">Action</span>
            </button>

            <button
              onClick={() => setShowDeleteAccount(true)}
              className="flex w-full items-center justify-between rounded-3xl border border-red-200/70 bg-red-50/80 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-300/20 focus:outline-none dark:border-red-500/20 dark:bg-red-500/10"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-300">
                  <UserX className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base text-red-600 dark:text-red-300">Delete account</p>
                  <p className="text-sm text-red-500/90 dark:text-red-300/80">Remove your profile, conversations, and keys forever.</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500/80">Danger</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Account information</h3>
          <div className="mt-3 space-y-3 rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Name</p>
              <p className="mt-1 font-display text-base text-slate-900 dark:text-white">{currentUser?.displayName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Email</p>
              <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">{currentUser?.email}</p>
            </div>
          </div>
        </section>
      </div>

      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Delete account?</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  This removes your profile, encrypted keys, and every conversation for good.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50/90 p-5 text-sm leading-relaxed text-red-700 shadow-inner dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              <p className="font-semibold">⚠️ No undo</p>
              <p className="mt-2">
                This action permanently wipes your encrypted history and recovery keys. Ensure you have backups before continuing.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Keep my account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete forever'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
