'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IconSidebar from './IconSidebar';
import Sidebar from './Sidebar';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';
import ChatView from './ChatView';
import { Menu, MessageSquare, Users, Bell, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
type ViewType = 'messages' | 'contacts' | 'notifications' | 'settings';

export default function ChatLayout() {
  const [activeView, setActiveView] = useState<ViewType>('messages');
  const { selectedConversationId, messages, currentUser, readNotifications } = useStore();

  // Calculate unread notifications count
  const unreadCount = useMemo(() => {
    let count = 0;
    Object.entries(messages).forEach(([conversationId, convMessages]) => {
      convMessages
        .filter(msg => msg.senderId !== currentUser?.id)
        .filter(msg => !readNotifications.has(msg.id))
        .forEach(() => count++);
    });
    return count;
  }, [messages, currentUser, readNotifications]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop: Icon Sidebar */}
      <div className="hidden lg:block">
        <div className="w-[88px] bg-gradient-to-b from-primary-600 to-primary-700 h-full flex flex-col items-center py-6 gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            <img src="/logo.png" alt="Lingo" className="w-full h-full object-cover" />
          </div>

          <nav className="flex-1 flex flex-col gap-3 w-full px-4">
            <button
              onClick={() => setActiveView('messages')}
              className={`w-full h-14 rounded-xl flex items-center justify-center transition-all ${
                activeView === 'messages' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveView('contacts')}
              className={`w-full h-14 rounded-xl flex items-center justify-center transition-all ${
                activeView === 'contacts' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveView('notifications')}
              className={`w-full h-14 rounded-xl flex items-center justify-center transition-all relative ${
                activeView === 'notifications' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`w-full h-14 rounded-xl flex items-center justify-center transition-all ${
                activeView === 'settings' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </div>

      {/* Desktop: Middle Panel */}
      <div className="hidden lg:block w-[380px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {activeView === 'notifications' ? (
          <NotificationsPanel onConversationClick={() => setActiveView('messages')} />
        ) : activeView === 'settings' ? (
          <SettingsPanel />
        ) : (
          <Sidebar onClose={() => {}} initialTab={activeView as 'messages' | 'contacts'} />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative pb-16 lg:pb-0">
        {/* Mobile: Show different views based on active tab */}
        <div className="lg:hidden h-full">
          {selectedConversationId ? (
            // Show chat when conversation is selected
            <ChatView />
          ) : activeView === 'messages' || activeView === 'contacts' ? (
            // Show conversations/contacts list
            <Sidebar onClose={() => {}} initialTab={activeView as 'messages' | 'contacts'} />
          ) : activeView === 'notifications' ? (
            // Show notifications
            <NotificationsPanel onConversationClick={() => setActiveView('messages')} />
          ) : (
            // Show settings
            <SettingsPanel />
          )}
        </div>

        {/* Desktop: Always show chat */}
        <div className="hidden lg:block h-full">
          <ChatView />
        </div>

        {/* Mobile: Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-4">
            <button
              onClick={() => setActiveView('messages')}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                activeView === 'messages'
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs font-medium">Messages</span>
            </button>

            <button
              onClick={() => setActiveView('contacts')}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                activeView === 'contacts'
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Contacts</span>
            </button>

            <button
              onClick={() => setActiveView('notifications')}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-colors relative ${
                activeView === 'notifications'
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Alerts</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                activeView === 'settings'
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
