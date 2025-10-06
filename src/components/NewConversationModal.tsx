'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations } from '@/hooks/useConversations';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewConversationModalProps {
  onClose: () => void;
}

export default function NewConversationModal({ onClose }: NewConversationModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { startConversation } = useConversations();
  const { setSelectedConversationId } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const conversationId = await startConversation(email);
      if (conversationId) {
        setSelectedConversationId(conversationId);
        toast.success('Conversation started!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">New Conversation</h2>
            <button
              onClick={onClose}
              className="p-1 glass-button hover:bg-white/40 dark:hover:bg-gray-700/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 glass-button border-0 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-2xl transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Starting...' : 'Start Conversation'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
