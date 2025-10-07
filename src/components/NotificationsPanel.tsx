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
          const timestamp = typeof msg.timestamp === 'number' ? new Date(msg.timestamp) : msg.timestamp;
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
    <div className="flex h-full flex-col">
      <div className="border-b border-white/30 px-6 py-6 dark:border-white/10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Activity</p>
        <h1 className="mt-3 text-2xl font-display text-slate-900 dark:text-white">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {notifications.length === 0
            ? 'You’re up to date — we’ll notify you when something happens.'
            : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} waiting for you.`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-[30px] border border-dashed border-white/50 bg-white/50 px-8 py-12 text-center text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-400/20 to-accent-400/20 text-primary-500">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-display text-slate-900 dark:text-white">All quiet for now</h3>
            <p className="mt-2 text-sm text-slate-500/80 dark:text-slate-400/80">
              Check back when new messages arrive — they’ll surface here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleNotificationClick(notification)}
                className="flex w-full flex-col gap-3 rounded-[28px] border border-white/20 bg-white/70 p-4 text-left shadow-[0_18px_40px_rgba(31,41,120,0.18)] transition hover:-translate-y-0.5 hover:border-white/40 hover:shadow-[0_22px_50px_rgba(31,41,120,0.26)] focus:outline-none dark:border-white/10 dark:bg-slate-900/70"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 to-accent-400/20 text-base font-semibold text-primary-600 shadow-sm dark:text-primary-200">
                    {notification.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-sm text-slate-900 dark:text-white">
                        {notification.senderName}
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true }).replace('about ', '')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2 dark:text-slate-300">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                  New message
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
