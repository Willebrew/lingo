'use client';

import { motion } from 'framer-motion';
import { Copy, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RecoveryCodeModalProps {
  recoveryCode: string;
  onClose: () => void;
}

export default function RecoveryCodeModal({ recoveryCode, onClose }: RecoveryCodeModalProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryCode);
    toast.success('Recovery code copied to clipboard!');
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [`Lingo Recovery Code\n\nIMPORTANT: Save this code securely!\n\nRecovery Code: ${recoveryCode}\n\nYou will need this code to recover your account if you forget your password or lose access to your device.`],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'lingo-recovery-code.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Recovery code downloaded!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Save Your Recovery Code</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Critical: You&apos;ll need this to recover your account
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>⚠️ Important:</strong> If you forget your password AND lose this recovery
            code, you will permanently lose access to your encrypted messages. There is no way to
            recover them.
          </p>
        </div>

        <div className="glass-button p-4 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your Recovery Code:</p>
          <code className="text-lg font-mono font-bold block text-center break-all">
            {recoveryCode}
          </code>
        </div>

        <div className="flex gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 glass-button hover:bg-white/40 dark:hover:bg-gray-700/40 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadCode}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 glass-button hover:bg-white/40 dark:hover:bg-gray-700/40 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-2xl transition-colors shadow-lg"
        >
          I&apos;ve Saved My Recovery Code
        </motion.button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          Store this code in a secure password manager or write it down and keep it in a safe place
        </p>
      </motion.div>
    </div>
  );
}
