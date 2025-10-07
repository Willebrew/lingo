'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Download, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RecoveryCodeModalProps {
  recoveryCode: string;
  onConfirm: () => void;
}

export default function RecoveryCodeModal({ recoveryCode, onConfirm }: RecoveryCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    toast.success('Private key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        'Lingo Private Key Backup\n' +
        '========================\n\n' +
        'Private Key: ' + recoveryCode + '\n\n' +
        'CRITICAL: Keep this private key safe and secure!\n' +
        '- This is your encryption private key\n' +
        '- You need this to restore your account and decrypt messages\n' +
        '- Without this key, you cannot decrypt your messages\n' +
        '- Lingo cannot recover this key for you - it only exists on your device\n' +
        '- Anyone with this key can decrypt your messages - keep it secret!\n' +
        '- Store it in a secure password manager or safe location\n\n' +
        'Generated: ' + new Date().toLocaleString() + '\n'
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lingo-private-key-' + Date.now() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    toast.success('Private key downloaded');
  };

  const canProceed = (copied || downloaded) && confirmed;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Save Your Private Key</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Critical - Required for E2E encryption
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-1">
                ⚠️ CRITICAL: You must save this private key NOW!
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4 list-disc">
                <li>This is your encryption private key - you need it to decrypt messages</li>
                <li>Without it, you&apos;ll lose access to all your messages forever</li>
                <li>Anyone with this key can decrypt your messages - keep it secret!</li>
                <li>Lingo cannot recover this key - it&apos;s only stored on your device</li>
                <li>This is the ONLY time you&apos;ll see this key</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Your Private Key:</label>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm text-center select-all border-2 border-primary-500 break-all">
            {recoveryCode}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleCopy}
            className={'flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ' + (copied ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}
          >
            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <button
            onClick={handleDownload}
            className={'flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ' + (downloaded ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600')}
          >
            {downloaded ? <CheckCircle className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            {downloaded ? 'Downloaded!' : 'Download'}
          </button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
              <strong>I understand</strong> that I must save this private key. If I lose it, I will
              permanently lose access to my encrypted messages and there is no way to recover them.
            </span>
          </label>
        </div>

        <button
          onClick={onConfirm}
          disabled={!canProceed}
          className={'w-full px-4 py-3 rounded-lg font-semibold transition-all ' + (canProceed ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed')}
        >
          I&apos;ve Saved My Private Key - Continue
        </button>

        {!canProceed && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            {!(copied || downloaded) && 'Please copy or download your private key'}
            {(copied || downloaded) && !confirmed && 'Please confirm you understand the importance'}
          </p>
        )}
      </motion.div>
    </div>
  );
}
