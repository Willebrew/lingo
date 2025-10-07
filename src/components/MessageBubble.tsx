'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/useMessages';
import { useStore } from '@/store/useStore';
import { Languages, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import type { DecryptedMessage } from '@/types';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isOwn: boolean;
  index: number;
}

export default function MessageBubble({ message, isOwn, index }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [targetLang, setTargetLang] = useState('');
  const { translateMessage } = useMessages(message.conversationId);
  const { currentUser, translatingMessages } = useStore();
  const isTranslating = translatingMessages.has(message.id);

  if (message.isSystemMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex justify-center py-2"
      >
        <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-2 text-xs text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
          <p className="font-medium text-slate-600 dark:text-slate-300">
            {message.content}
            <span className="text-slate-400"> — {message.senderName}</span>
          </p>
        </div>
      </motion.div>
    );
  }

  const handleTranslateClick = () => {
    if (currentUser?.preferredLanguage) {
      setTargetLang(currentUser.preferredLanguage);
    }
    setShowWarning(true);
  };

  const handleTranslate = async () => {
    if (!targetLang) return;
    await translateMessage(message.id, targetLang);
    setShowMenu(false);
    setShowWarning(false);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'sv', name: 'Swedish (Svenska)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`relative group flex max-w-[72%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {!isOwn && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 to-accent-400/20 text-sm font-semibold text-primary-600 shadow-sm dark:text-primary-200">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {!isOwn && (
              <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                {message.senderName}
              </span>
            )}

            <div
              className={`relative rounded-[26px] px-5 py-3 shadow-lg backdrop-blur ${
                isOwn
                  ? 'bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 text-white'
                  : 'border border-white/50 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

              {isTranslating && (
                <span className={`mt-3 inline-flex items-center gap-2 text-xs ${isOwn ? 'text-white/80' : 'text-primary-600 dark:text-primary-300'}`}>
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.38 0 0 5.38 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.05 1.14 5.84 3.01 7.96l2.99-2.669z" />
                  </svg>
                  Translating...
                </span>
              )}

              {message.translated && !isTranslating && (
                <span className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${isOwn ? 'text-white/80' : 'text-primary-600 dark:text-primary-200'}`}>
                  <Languages className="h-3 w-3" />
                  Translated
                </span>
              )}

              {!isOwn && (
                <>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/50 bg-white/70 text-slate-400 opacity-0 transition hover:text-primary-600 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/40 bg-white/85 p-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
                    >
                      <button
                        onClick={handleTranslateClick}
                        disabled={isTranslating}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      >
                        <Languages className="h-4 w-4" />
                        {isTranslating ? 'Translating...' : 'Translate'}
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <div className={`mt-1 flex items-center gap-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-slate-400 dark:text-slate-300'}`}>
                {format(message.timestamp, 'p')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-white/30 bg-white/85 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          >
            <h3 className="text-2xl font-display text-slate-900 dark:text-white">Translation security check</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Translating sends the decrypted message to our secure translation service. Proceed only if you trust the destination.
            </p>

            <div className="mt-6 rounded-2xl border border-yellow-200/70 bg-yellow-50/90 p-4 text-sm leading-relaxed text-yellow-800 shadow-inner dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100">
              <p className="font-semibold">Heads up</p>
              <p className="mt-2">
                This temporarily steps outside end-to-end encryption. Avoid translating sensitive details.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Target language
              </p>
              <div className="mt-3 relative">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-800/40"
                >
                  <option value="">Select language</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleTranslate}
                disabled={!targetLang || isTranslating}
                className="flex-1 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTranslating ? 'Translating...' : 'Translate now'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
