'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import AuthForm from '@/components/AuthForm';
import ChatLayout from '@/components/ChatLayout';

export default function Home() {
  const { currentUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  useAuth();
  useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for auth to be checked before showing anything
  useEffect(() => {
    if (mounted) {
      // Give Firebase auth time to restore session
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Show loading spinner while checking auth
  if (!mounted || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return currentUser ? <ChatLayout /> : <AuthForm />;
}
