'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ChatView from './ChatView';
import { Menu } from 'lucide-react';

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed lg:relative inset-y-0 left-0 z-40 lg:z-0 w-80"
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
