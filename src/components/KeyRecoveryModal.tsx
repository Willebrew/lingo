'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Key, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { recoverPrivateKey, generateKeyPair, storePrivateKey } from '@/utils/encryption';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface KeyRecoveryModalProps {
  onSuccess: () => void;
}

export default function KeyRecoveryModal({ onSuccess }: KeyRecoveryModalProps) {
  const { currentUser, userPassword } = useStore();
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegenerateOption, setShowRegenerateOption] = useState(false);

  const handleRecover = async () => {
    if (!currentUser || !recoveryCode.trim()) return;

    setLoading(true);
    try {
      const privateKey = await recoverPrivateKey(currentUser.id, recoveryCode.trim());

      if (privateKey && userPassword) {
        // Re-store the private key with current password
        await storePrivateKey(currentUser.id, privateKey, userPassword);
        toast.success('Private key recovered successfully!');
        onSuccess();
      } else {
        toast.error('Invalid recovery code. Please try again.');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast.error('Recovery failed. Please check your code.');
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

      // Store private key
      const newRecoveryCode = await storePrivateKey(currentUser.id, privateKey, userPassword);

      // Update public key in Firestore
      await updateDoc(doc(db, 'users', currentUser.id), {
        publicKey,
      });

      toast.success(
        `New encryption keys generated!\n\nNew Recovery Code:\n${newRecoveryCode}\n\nSave this code - you'll need it to recover your account!`,
        { duration: 10000 }
      );

      onSuccess();
    } catch (error) {
      console.error('Key regeneration failed:', error);
      toast.error('Failed to generate new keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Encryption Keys Missing</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your private key is not found
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Important:</strong> Without your private key, you cannot decrypt messages.
            You can either recover it using your recovery code or generate new keys (old messages will be lost).
          </p>
        </div>

        {!showRegenerateOption ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                <Key className="w-4 h-4 inline mr-1" />
                Recovery Code
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="word-word-word-word-word-word"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRecover}
                disabled={!recoveryCode.trim() || loading}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recovering...' : 'Recover Keys'}
              </button>

              <button
                onClick={() => setShowRegenerateOption(true)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                I don&apos;t have my recovery code
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>⚠️ Warning:</strong> Generating new keys will make all your existing encrypted
                messages unreadable. Only do this if you&apos;ve lost your recovery code.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateOption(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate New Keys'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
