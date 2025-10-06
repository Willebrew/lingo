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
  const [showTranslate, setShowTranslate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [targetLang, setTargetLang] = useState('');
  const { translateMessage } = useMessages(message.conversationId);
  const { selectedConversationId, currentUser } = useStore();

  const handleTranslateClick = () => {
    // Auto-set target language to user's preferred language
    if (currentUser?.preferredLanguage) {
      setTargetLang(currentUser.preferredLanguage);
    }
    setShowWarning(true);
  };

  const handleTranslate = async () => {
    if (!targetLang) return;
    await translateMessage(message.id, targetLang);
    setShowTranslate(false);
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
      <div className={`relative group max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-start gap-2">
          {!isOwn && (
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            {!isOwn && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                {message.senderName}
              </span>
            )}

            <div
              className={`relative px-4 py-2.5 rounded-2xl ${
                isOwn
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

              {message.translated && (
                <span className="inline-flex items-center gap-1 text-xs opacity-70 mt-1">
                  <Languages className="w-3 h-3" />
                  Translated
                </span>
              )}

              {/* Message menu */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute ${
                    isOwn ? 'right-0' : 'left-0'
                  } top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-10 min-w-[150px]`}
                >
                  <button
                    onClick={handleTranslateClick}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                    Translate
                  </button>
                </motion.div>
              )}
            </div>

            {/* Translation Warning Dialog */}
            {showWarning && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
                >
                  <h3 className="text-lg font-bold mb-3">⚠️ Security Warning</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Translation breaks end-to-end encryption!</strong>
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      To translate this message, its decrypted content will be sent to our server and the Claude AI API. This means the message will temporarily leave the encrypted channel.
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Translate to:
                      {currentUser?.preferredLanguage && (
                        <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                          Your preferred language
                        </span>
                      )}
                    </p>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="">Select language</option>
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowWarning(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTranslate}
                      disabled={!targetLang}
                      className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      I Understand, Translate
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
              {format(message.timestamp, 'p')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
