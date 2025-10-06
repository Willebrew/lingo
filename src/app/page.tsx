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
  useAuth();
  useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return currentUser ? <ChatLayout /> : <AuthForm />;
}
