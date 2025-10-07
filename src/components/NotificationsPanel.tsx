'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, MessageSquare } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'message';
  conversationId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  onConversationClick?: () => void;
}

export default function NotificationsPanel({ onConversationClick }: NotificationsPanelProps = {}) {
  const { messages, conversations, currentUser, setSelectedConversationId, readNotifications } = useStore();

  // Generate notifications from all messages
  const notifications = useMemo(() => {
    const allNotifications: Notification[] = [];

    // Get all messages from all conversations
    Object.entries(messages).forEach(([conversationId, convMessages]) => {
      convMessages
        .filter(msg => msg.senderId !== currentUser?.id) // Only messages from others
        .filter(msg => !readNotifications.has(msg.id)) // Filter out read messages
        .forEach(msg => {
          const timestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
          allNotifications.push({
            id: msg.id,
            type: 'message',
            conversationId,
            senderName: msg.senderName,
            message: msg.content,
            timestamp,
            read: false,
          });
        });
    });

    // Sort by most recent first
    return allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [messages, currentUser, readNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedConversationId(notification.conversationId);
    onConversationClick?.();
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You're all caught up! New message notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {notifications.map((notification, index) => (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {notification.senderName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">
                        {notification.senderName}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true }).replace('about ', '')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        New message
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
