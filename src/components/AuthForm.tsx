'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { Lock, ShieldCheck, Sparkles, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import RecoveryCodeModal from './RecoveryCodeModal';
import Image from 'next/image';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'sv', name: 'Swedish (Svenska)' },
  { code: 'no', name: 'Norwegian (Norsk)' },
  { code: 'da', name: 'Danish (Dansk)' },
  { code: 'fi', name: 'Finnish (Suomi)' },
];

interface AuthFormProps {
  onRecoveryModalChange?: (showing: boolean) => void;
}

export default function AuthForm({ onRecoveryModalChange }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const { signIn, signUp } = useAuth();
  const { setCurrentUser, setIsSigningUp, setJustCompletedSignup } = useStore();

  const highlights = [
    {
      title: 'Private by default',
      description: 'End-to-end encryption shields every message and file.',
      icon: <Lock className="h-5 w-5 text-primary-600" />,
    },
    {
      title: 'Built-in translation',
      description: 'Choose a language once and collaborate in real time.',
      icon: <Languages className="h-5 w-5 text-primary-600" />,
    },
    {
      title: 'Simple recovery',
      description: 'Keep access keys safe with human-friendly recovery codes.',
      icon: <ShieldCheck className="h-5 w-5 text-primary-600" />,
    },
    {
      title: 'Designed for teams',
      description: 'Spaces and roles tuned for modern collaboration.',
      icon: <Sparkles className="h-5 w-5 text-primary-600" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          toast.error('Please enter a display name');
          return;
        }
        const result = await signUp(email, password, displayName, preferredLanguage);
        if (result.success) {
          if (result.recoveryCode && result.userData) {
            setRecoveryCode(result.recoveryCode);
            setPendingUserData(result.userData);
            onRecoveryModalChange?.(true);
          } else {
            toast.success('Account created successfully!');
          }
        } else {
          toast.error(result.error || 'Sign up failed');
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          toast.success('Signed in successfully!');
        } else {
          toast.error(result.error || 'Sign in failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-140px] h-[420px] w-[420px] rounded-full bg-primary-300/35 blur-[140px]" />
        <div className="absolute -right-28 bottom-[-120px] h-[420px] w-[420px] rounded-full bg-accent-300/30 blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-[160px]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-14 lg:flex-row lg:items-center lg:gap-16 lg:px-12"
      >
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3 text-primary-600">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-lg">
              <Image src="/logo.png" alt="Lingo" width={44} height={44} className="h-10 w-10 rounded-xl object-cover" priority />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary-500">Lingo</span>
          </div>

          <h1 className="mt-9 text-4xl font-display leading-tight text-slate-900 sm:text-5xl">
            Secure conversations, in any language.
          </h1>
          <p className="mt-4 max-w-lg text-base text-slate-600">
            Lingo keeps every message private and translated, so teams can work confidently across borders and time zones.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }}
          className="mt-12 w-full max-w-md rounded-[32px] border border-white/80 bg-white/95 p-10 shadow-[0_30px_70px_rgba(82,103,255,0.18)] backdrop-blur"
        >
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-600">
              <Sparkles className="h-3.5 w-3.5 text-primary-500" />
              {isSignUp ? 'Sign up' : 'Welcome back'}
            </span>
            <h2 className="mt-4 text-3xl font-display text-slate-900">
              {isSignUp ? 'Create your Lingo account' : 'Sign in to Lingo'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isSignUp
                ? 'Set up your secure workspace in a few quick steps.'
                : 'Enter your details to continue the conversation.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                    placeholder="Alex Johnson"
                    required={isSignUp}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Preferred language
                  </label>
                  <div className="relative">
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500/80">
                    Every message you receive will be translated to this language by default.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                placeholder="Enter a strong password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 translate-y-full bg-white/25 transition-transform duration-300 ease-out group-hover:translate-y-0" />
              <span className="relative">
                {loading ? 'Just a sec…' : isSignUp ? 'Create account' : 'Sign in'}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : 'New to Lingo?'}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary-600 underline-offset-4 transition hover:underline"
            >
              {isSignUp ? 'Sign in instead' : 'Create one'}
            </button>
          </div>
        </motion.div>
      </motion.main>

      {recoveryCode && (
        <RecoveryCodeModal
          recoveryCode={recoveryCode}
          onConfirm={() => {
            setRecoveryCode(null);
            onRecoveryModalChange?.(false);
            setJustCompletedSignup(true);
            setIsSigningUp(false);
            if (pendingUserData) {
              setCurrentUser(pendingUserData);
              setPendingUserData(null);
            }
            setTimeout(() => setJustCompletedSignup(false), 2000);
            toast.success('Account created successfully! Welcome to Lingo.');
          }}
        />
      )}
    </div>
  );
}
