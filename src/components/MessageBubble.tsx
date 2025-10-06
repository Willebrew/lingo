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
  const [targetLang, setTargetLang] = useState('');
  const { translateMessage } = useMessages(message.conversationId);
  const { selectedConversationId } = useStore();

  const handleTranslate = async () => {
    if (!targetLang) return;
    await translateMessage(message.id, targetLang);
    setShowTranslate(false);
    setShowMenu(false);
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
              className={`relative px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
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
                className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute ${
                    isOwn ? 'right-0' : 'left-0'
                  } top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[150px]`}
                >
                  <button
                    onClick={() => setShowTranslate(!showTranslate)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm"
                  >
                    <Languages className="w-4 h-4" />
                    Translate
                  </button>

                  {showTranslate && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded mb-2"
                      >
                        <option value="">Select language</option>
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleTranslate}
                        disabled={!targetLang}
                        className="w-full px-3 py-1 bg-primary-500 text-white rounded text-sm disabled:opacity-50"
                      >
                        Translate
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
              {format(message.timestamp, 'p')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
