'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Key, RefreshCw, Copy, Download, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { restorePrivateKey, generateKeyPair, storePrivateKey } from '@/utils/encryption';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface KeyRecoveryModalProps {
  onSuccess: () => void;
}

export default function KeyRecoveryModal({ onSuccess }: KeyRecoveryModalProps) {
  const { currentUser, userPassword, setUserPassword, triggerKeyRestored } = useStore();
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegenerateOption, setShowRegenerateOption] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRecover = async () => {
    if (!currentUser || !privateKeyInput.trim() || !userPassword) return;

    setLoading(true);
    try {
      // Validate and restore the private key (verifies it matches user's public key)
      const success = await restorePrivateKey(currentUser.id, privateKeyInput.trim(), userPassword, currentUser.publicKey);

      if (!success) {
        toast.error('This private key does not belong to your account. Please check and try again.');
        setLoading(false);
        return;
      }

      toast.success('Private key restored successfully!');
      triggerKeyRestored(); // Trigger reload of messages
      onSuccess();
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Restore failed. Please check your private key.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentUser || !userPassword) return;

    setLoading(true);
    try {
      // Generate new key pair
      const { publicKey, privateKey } = generateKeyPair();

      // Store private key with user's password
      await storePrivateKey(currentUser.id, privateKey, userPassword);

      // Update public key in Firestore
      await updateDoc(doc(db, 'users', currentUser.id), {
        publicKey,
      });

      // Show the new private key in the modal
      setNewGeneratedKey(privateKey);
      toast.success('New encryption keys generated!');
    } catch (error) {
      console.error('Key regeneration failed:', error);
      toast.error('Failed to generate new keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newGeneratedKey) return;

    try {
      await navigator.clipboard.writeText(newGeneratedKey);
      setCopied(true);
      toast.success('Private key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadKey = () => {
    if (!newGeneratedKey) return;

    const blob = new Blob([newGeneratedKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingo-private-key-${currentUser?.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Private key downloaded!');
  };

  const handleConfirmSaved = () => {
    triggerKeyRestored();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
      >
        {newGeneratedKey ? (
          // Show the new generated key with copy/download options
          <>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 text-white shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">New keys generated!</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Save your private key now. You&apos;ll need it to restore your account.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50/90 p-4 text-sm leading-relaxed text-red-700 shadow-inner dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              <p className="font-semibold">⚠️ Critical - Save this now!</p>
              <p className="mt-2">
                Your private key will only be shown once. Copy or download it immediately. Without it, you cannot recover your encrypted messages.
              </p>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Key className="h-4 w-4" /> Your new private key
                </span>
              </label>
              <div className="mt-3 rounded-2xl border border-white/40 bg-white/70 p-4 font-mono text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100">
                <div className="break-all">{newGeneratedKey}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCopyKey}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy key'}
                </span>
              </button>
              <button
                onClick={handleDownloadKey}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </span>
              </button>
            </div>

            <button
              onClick={handleConfirmSaved}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
            >
              I&apos;ve saved my private key
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-white shadow-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display text-slate-900 dark:text-white">Private key missing</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Restore it with your recovery code or generate a fresh key pair.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-200/70 bg-yellow-50/90 p-4 text-sm leading-relaxed text-yellow-800 shadow-inner dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100">
              <p className="font-semibold">⚠️ Important</p>
              <p className="mt-2">
                Without your private key you can&apos;t decrypt past messages. Restoring keeps your history; regenerating wipes previous encrypted conversations.
              </p>
            </div>

            {!showRegenerateOption ? (
          <>
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Key className="h-4 w-4" /> Private key
                </span>
              </label>
              <textarea
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                placeholder="Paste your private key here (base64 string)"
                rows={4}
                className="mt-3 w-full resize-none rounded-2xl border border-white/40 bg-white/70 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
              />
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleRecover}
                disabled={!privateKeyInput.trim() || loading}
                className="w-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Restoring...' : 'Restore private key'}
              </button>

              <button
                onClick={() => setShowRegenerateOption(true)}
                className="w-full rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                I don’t have my key
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50/90 p-4 text-sm leading-relaxed text-red-700 shadow-inner dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
              <p className="font-semibold">This is irreversible</p>
              <p className="mt-2">
                Generating new keys preserves future security but makes previous encrypted messages unreadable. Continue only if you accept losing that history.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowRegenerateOption(false)}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Go back
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {loading ? 'Generating...' : 'Generate new keys'}
                </span>
              </button>
            </div>
          </>
        )}
          </>
        )}
      </motion.div>
    </div>
  );
}
