'use client';

import { Home, MessageSquare, Bell, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Image from 'next/image';

interface IconSidebarProps {
  activeView?: 'home' | 'messages' | 'notifications' | 'settings';
  onViewChange?: (view: 'home' | 'messages' | 'notifications' | 'settings') => void;
}

export default function IconSidebar({ activeView = 'messages', onViewChange }: IconSidebarProps) {
  const { currentUser } = useStore();

  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'messages' as const, icon: MessageSquare, label: 'Messages' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-[88px] bg-gradient-to-b from-primary-600 to-primary-700 flex flex-col items-center py-6 gap-6">
      {/* Profile Picture */}
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
          {currentUser?.avatarUrl ? (
            <Image
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
              {currentUser?.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary-600 rounded-full" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange?.(item.id)}
              className={`
                relative w-full h-14 rounded-xl flex items-center justify-center
                transition-all duration-200 group
                ${isActive
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                }
              `}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-6 h-6" />

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Puzzle piece icon at bottom (optional branding) */}
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
