'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ChatView from './ChatView';
import { Menu } from 'lucide-react';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-900">
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-800">
        <Sidebar onClose={() => {}} />
      </div>

      {/* Mobile menu button - Always visible on mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-50 p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-2xl"
      >
        <Menu className="w-6 h-6" />
      </motion.button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat view */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatView />
      </div>
    </div>
  );
}
