'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import AuthForm from '@/components/AuthForm';
import ChatLayout from '@/components/ChatLayout';

declare global {
  interface Window {
    lingoCleanupDone?: boolean;
  }
}

export default function Home() {
  const { currentUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showingRecoveryModal, setShowingRecoveryModal] = useState(false);
  useAuth();
  useTheme();

  // Cleanup old password storage keys (lingo_pw_*) from broken encryption system
  if (typeof window !== 'undefined') {
    const cleanupDone = localStorage.getItem('lingo_pw_cleanup_done');
    if (!cleanupDone) {
      const keysToRemove: string[] = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lingo_pw_')) {
          keysToRemove.push(key);
        }
      });
      if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[Cleanup] Removed ${keysToRemove.length} old password storage keys`);
      }
      localStorage.setItem('lingo_pw_cleanup_done', 'true');
    }
  }

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
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/30 blur-[150px]" />
          <div className="absolute top-1/2 right-0 h-80 w-80 translate-x-1/3 -translate-y-1/2 rounded-full bg-accent-400/25 blur-[140px]" />
          <div className="absolute bottom-[-30%] left-[-10%] h-80 w-80 rounded-full bg-primary-300/20 blur-[140px]" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <div className="flex flex-col items-center gap-6 rounded-[28px] border border-white/50 bg-white/70 p-10 shadow-subtle backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-500 via-primary-400 to-accent-400 opacity-60" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-600 shadow-lg dark:bg-slate-900 dark:text-primary-300">
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-slate-900 dark:text-white">Setting up your secure space…</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We’re restoring your encrypted conversations.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If showing recovery modal, keep showing AuthForm even if user is set
  if (showingRecoveryModal) {
    return <AuthForm onRecoveryModalChange={setShowingRecoveryModal} />;
  }

  return currentUser ? <ChatLayout /> : <AuthForm onRecoveryModalChange={setShowingRecoveryModal} />;
}
