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
  const { setCurrentUser, setIsSigningUp } = useStore();

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
        console.log('[AuthForm] Signup result:', {
          success: result.success,
          hasRecoveryCode: !!result.recoveryCode,
          hasUserData: !!result.userData,
          recoveryCode: result.recoveryCode
        });

        if (result.success) {
          // Show recovery code modal - don't navigate away yet
          if (result.recoveryCode && result.userData) {
            console.log('[AuthForm] Setting recovery code modal to show');
            setRecoveryCode(result.recoveryCode);
            setPendingUserData(result.userData);
            onRecoveryModalChange?.(true);
          } else {
            console.warn('[AuthForm] Missing recovery code or user data!');
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary-500/30 blur-[140px]" />
        <div className="absolute top-32 -right-32 h-[420px] w-[420px] rounded-full bg-accent-400/25 blur-[160px]" />
        <div className="absolute -bottom-48 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary-300/20 blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-6 py-16 lg:flex-row lg:items-start lg:py-24"
      >
        <div className="flex w-full flex-1 flex-col items-center gap-10 lg:items-start">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Private preview
            </span>
            <h1 className="mt-6 text-4xl font-display text-slate-900 dark:text-white sm:text-5xl">
              Conversations that sound natural,
              <span className="text-primary-600"> instantly translated</span>.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Lingo keeps your chats beautifully secure while making every message feel personal. Share moments, collaborate across languages, and stay in sync without compromising privacy.
            </p>
          </div>

          <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-lg backdrop-blur xl:p-6 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-600">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg text-slate-900 dark:text-white">End-to-end first</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Every word is encrypted before it leaves your device.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-lg backdrop-blur xl:p-6 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-600">
                  <Languages className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg text-slate-900 dark:text-white">Live translation</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pick a preferred language and we handle the rest.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-lg backdrop-blur xl:p-6 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg text-slate-900 dark:text-white">Recovery ready</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Safeguard your keys with elegant recovery workflows.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-lg backdrop-blur xl:p-6 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-600">
                  <Image src="/logo.png" alt="Lingo" width={32} height={32} className="rounded-xl" />
                </span>
                <div>
                  <p className="font-display text-lg text-slate-900 dark:text-white">Made for teams</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Group spaces that feel high-touch and beautifully minimal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-14 w-full max-w-lg lg:mt-0">
          <div className="absolute -inset-x-4 -top-8 bottom-12 rounded-[40px] bg-gradient-to-br from-primary-500/20 via-transparent to-accent-400/20 blur-3xl" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
            className="relative rounded-[32px] border border-white/40 bg-white/80 p-10 shadow-floating backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
          >
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
                Say hello
              </span>
              <h2 className="mt-4 text-3xl font-display text-slate-900 dark:text-white">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isSignUp ? 'Join the beta to start secure multilingual conversations.' : 'Sign in to continue your private conversations.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
                      placeholder="Alex Johnson"
                      required={isSignUp}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                      Preferred language
                    </label>
                    <div className="relative">
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500/80 dark:text-slate-400/80">
                      Messages will be translated to this language by default.
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 focus:ring-primary-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <span className="relative">
                  {loading ? 'Just a sec…' : isSignUp ? 'Join Lingo' : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isSignUp ? 'Already have an account?' : "New here?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-primary-600 underline-offset-4 transition hover:underline dark:text-primary-400"
              >
                {isSignUp ? 'Sign in instead' : 'Create one'}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {recoveryCode && (
        <RecoveryCodeModal
          recoveryCode={recoveryCode}
          onConfirm={() => {
            setRecoveryCode(null);
            onRecoveryModalChange?.(false);
            setIsSigningUp(false);
            if (pendingUserData) {
              setCurrentUser(pendingUserData);
              setPendingUserData(null);
            }
            toast.success('Account created successfully! Welcome to Lingo.');
          }}
        />
      )}
    </div>
  );
}
