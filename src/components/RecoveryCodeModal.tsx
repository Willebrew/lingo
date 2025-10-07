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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl rounded-[34px] border border-white/20 bg-white/85 p-10 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400 text-white shadow-lg">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-3xl font-display text-slate-900 dark:text-white">Save your private key</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This is the only time we can show it. Secure it before you continue.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-red-200/70 bg-red-50/90 p-5 shadow-inner dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex gap-3 text-sm text-red-700 dark:text-red-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="font-semibold uppercase tracking-[0.2em] text-xs text-red-500 dark:text-red-200">
                Critical security notice
              </p>
              <ul className="space-y-1 text-xs leading-relaxed">
                <li>This key decrypts every message—you must keep it safe and secret.</li>
                <li>If you lose it, you lose your encrypted history permanently.</li>
                <li>Lingo never stores a copy; this is the only moment it exists on our side.</li>
                <li>Anyone with this key can read your messages. Treat it like a password.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Private key
          </label>
          <div className="mt-3 rounded-3xl border border-primary-400/60 bg-primary-500/5 p-5 text-center font-mono text-sm text-primary-700 shadow-inner dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-200">
            {recoveryCode}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              copied
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'border border-white/50 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {copied ? 'Copied' : 'Copy key'}
          </button>
          <button
            onClick={handleDownload}
            className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              downloaded
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'border border-white/50 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            {downloaded ? <CheckCircle className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            {downloaded ? 'Downloaded' : 'Download'}
          </button>
        </div>

        <label className="mt-8 flex items-start gap-3 rounded-3xl border border-yellow-200/70 bg-yellow-50/90 p-5 text-sm text-yellow-800 shadow-inner dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-yellow-400 text-primary-500 focus:ring-2 focus:ring-primary-400"
          />
          <span>
            <strong>I understand</strong> that if I misplace this key, my encrypted messages cannot be recovered and no one—including Lingo—can help restore them.
          </span>
        </label>

        <button
          onClick={onConfirm}
          disabled={!canProceed}
          className={`mt-8 w-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 ${
            canProceed ? '' : 'cursor-not-allowed opacity-50'
          }`}
        >
          I’ve secured my key — continue
        </button>

        {!canProceed && (
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {!(copied || downloaded) && 'Copy or download the key to proceed.'}
            {(copied || downloaded) && !confirmed && 'Confirm that you understand the responsibility.'}
          </p>
        )}
      </motion.div>
    </div>
  );
}
