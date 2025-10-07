'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Sidebar from './Sidebar';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';
import ChatView from './ChatView';
import KeyRecoveryModal from './KeyRecoveryModal';
import { MessageSquare, Users, Bell, Settings, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getPrivateKey } from '@/utils/encryption';
type ViewType = 'messages' | 'contacts' | 'notifications' | 'settings';

export default function ChatLayout() {
  const [activeView, setActiveView] = useState<ViewType>('messages');
  const { selectedConversationId, messages, currentUser, readNotifications, userPassword, justCompletedSignup } = useStore();
  const [showKeyRecovery, setShowKeyRecovery] = useState(false);
  const keyCheckDone = useRef(false);

  // Check if private key exists on login - only once per user
  useEffect(() => {
    // Reset check when user changes
    keyCheckDone.current = false;
  }, [currentUser?.id]);

  useEffect(() => {
    const checkPrivateKey = async () => {
      // Don't check if user just completed signup - they already saw the recovery code
      if (currentUser && userPassword && !keyCheckDone.current && !justCompletedSignup) {
        keyCheckDone.current = true;
        const privateKey = await getPrivateKey(currentUser.id, userPassword, true);

        if (!privateKey) {
          // Key is corrupted or missing - clean it up
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`lingo_pk_${currentUser.id}`);
          }
          setShowKeyRecovery(true);
        }
      }
    };
    checkPrivateKey();
  }, [currentUser, userPassword, justCompletedSignup]);

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
    <>
      {showKeyRecovery && (
        <KeyRecoveryModal onSuccess={() => setShowKeyRecovery(false)} />
      )}
      <div className="fixed inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[130%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-[120px] bg-white/18 blur-[180px]" />
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary-500/25 blur-[140px]" />
        <div className="absolute top-1/3 -right-24 h-[360px] w-[360px] rounded-full bg-accent-400/20 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary-300/18 blur-[180px]" />
        <div className="absolute inset-x-[-28%] bottom-[-55%] h-[680px] rounded-[280px] bg-gradient-to-t from-white/55 via-white/20 to-transparent blur-[240px]" />
        <div className="absolute inset-x-[-10%] bottom-[-12%] h-[360px] bg-gradient-to-t from-white/45 via-white/20 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: Icon Sidebar */}
          <div className="hidden lg:flex w-[96px] flex-col border-r border-white/15 bg-white/8 p-4 text-slate-700 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/20">
            <div className="flex h-16 w-full items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/80 shadow-lg dark:border-white/10 dark:bg-slate-950/70">
                <Image src="/logo.png" alt="Lingo" width={60} height={60} className="h-10 w-10 rounded-xl object-cover" priority />
              </div>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-3">
              {[
                { id: 'messages' as ViewType, icon: MessageSquare, label: 'Messages' },
                { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
                { id: 'notifications' as ViewType, icon: Bell, label: 'Notifications' },
                { id: 'settings' as ViewType, icon: Settings, label: 'Settings' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`group relative flex h-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
                      isActive
                        ? 'border-white/80 bg-white text-primary-600 shadow-lg dark:border-white/20 dark:bg-slate-950 dark:text-primary-300'
                        : 'border-transparent bg-white/10 text-slate-500 hover:border-white/40 hover:bg-white/30 hover:text-primary-600 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs font-semibold text-white shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-3 top-1 h-1 rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/35 bg-white/90 text-primary-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-primary-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Desktop: Middle Panel */}
          <div className="hidden lg:flex w-[380px] flex-col">
            <div className="flex h-full w-full flex-col overflow-hidden border-r border-white/15 bg-white/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/40">
              {activeView === 'notifications' ? (
                <NotificationsPanel onConversationClick={() => setActiveView('messages')} />
              ) : activeView === 'settings' ? (
                <SettingsPanel />
              ) : (
                <Sidebar onClose={() => {}} initialTab={activeView as 'messages' | 'contacts'} />
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex h-full flex-col overflow-hidden bg-white/8 backdrop-blur-2xl dark:bg-slate-950/45">
              <div className="block h-full lg:hidden">
                {selectedConversationId ? (
                  <ChatView />
                ) : activeView === 'messages' || activeView === 'contacts' ? (
                  <Sidebar onClose={() => {}} initialTab={activeView as 'messages' | 'contacts'} />
                ) : activeView === 'notifications' ? (
                  <NotificationsPanel onConversationClick={() => setActiveView('messages')} />
                ) : (
                  <SettingsPanel />
                )}
              </div>

              <div className="hidden h-full lg:block">
                <ChatView />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Bottom Navigation */}
        <div className="lg:hidden">
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/50 bg-white/70 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-center justify-between">
              {[
                { id: 'messages' as ViewType, icon: MessageSquare, label: 'Messages' },
                { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
                { id: 'notifications' as ViewType, icon: Bell, label: 'Notifications' },
                { id: 'settings' as ViewType, icon: Settings, label: 'Settings' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`relative flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      isActive
                        ? 'text-primary-600'
                        : 'text-slate-400 hover:text-primary-500'
                    }`}
                  >
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border text-sm transition ${
                        isActive
                          ? 'border-primary-500/50 bg-primary-500/15 text-primary-600'
                          : 'border-transparent bg-white/40 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
