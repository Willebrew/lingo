import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';

export function useNotifications() {
  const { currentUser, notificationsEnabled, notificationSoundEnabled } = useStore();
  const permissionGranted = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Initialize audio
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/notification.wav');
      audioRef.current.volume = 0.5;
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        permissionGranted.current = permission === 'granted';
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      permissionGranted.current = true;
    }
  }, [currentUser]);

  const playNotificationSound = useCallback(() => {
    if (notificationSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }, [notificationSoundEnabled]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!notificationsEnabled) return;
    if (!permissionGranted.current || !('Notification' in window)) return;

    // Don't show notification if window is focused
    if (document.hasFocus()) return;

    playNotificationSound();

    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });
  }, [notificationsEnabled, playNotificationSound]);

  const notifyNewMessage = useCallback((senderName: string, message: string) => {
    showNotification(`New message from ${senderName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: 'new-message',
    });
  }, [showNotification]);

  return {
    notifyNewMessage,
    showNotification,
  };
}
