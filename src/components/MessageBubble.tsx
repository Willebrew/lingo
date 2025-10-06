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
  const { selectedConversationId } = useStore();

  const handleTranslateClick = () => {
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
    { code: 'Spanish', name: 'Spanish' },
    { code: 'French', name: 'French' },
    { code: 'German', name: 'German' },
    { code: 'Italian', name: 'Italian' },
    { code: 'Portuguese', name: 'Portuguese' },
    { code: 'Russian', name: 'Russian' },
    { code: 'Japanese', name: 'Japanese' },
    { code: 'Korean', name: 'Korean' },
    { code: 'Chinese', name: 'Chinese' },
    { code: 'Arabic', name: 'Arabic' },
    { code: 'Hindi', name: 'Hindi' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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

            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`relative px-4 py-2 rounded-2xl shadow-lg ${
                isOwn
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'glass text-gray-900 dark:text-white rounded-bl-sm'
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
                className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 glass-button hover:bg-white/40 dark:hover:bg-gray-600/40"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute ${
                    isOwn ? 'right-0' : 'left-0'
                  } top-full mt-1 glass-card shadow-2xl p-2 z-10 min-w-[150px]`}
                >
                  <button
                    onClick={handleTranslateClick}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/40 dark:hover:bg-gray-600/40 rounded-2xl text-sm transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                    Translate
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Translation Warning Dialog */}
            {showWarning && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="glass-card p-6 max-w-md w-full"
                >
                  <h3 className="text-lg font-bold mb-3">⚠️ Security Warning</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Translation breaks end-to-end encryption!</strong>
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      To translate this message, its decrypted content will be sent to our server and the Claude AI API. This means the message will temporarily leave the encrypted channel.
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select a language to proceed:
                  </p>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full px-3 py-2 glass-button border-0 rounded-2xl mb-4 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowWarning(false)}
                      className="flex-1 px-4 py-2 glass-button hover:bg-white/40 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTranslate}
                      disabled={!targetLang}
                      className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
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
