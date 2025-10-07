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
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 lg:px-10"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-10">
            <div className="max-w-xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5" />
                Private preview
              </span>
              <h1 className="mt-6 text-4xl font-display text-slate-900 sm:text-5xl dark:text-white">
                Secure multilingual messaging made effortless.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Lingo keeps teams in sync across languages with beautiful, end-to-end encrypted chat built for trust.
              </p>
            </div>

            <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'End-to-end first',
                  description: 'Every word is encrypted before it leaves your device.',
                  icon: <Lock className="h-5 w-5" />,
                },
                {
                  title: 'Live translation',
                  description: 'Pick a preferred language and we handle the rest.',
                  icon: <Languages className="h-5 w-5" />,
                },
                {
                  title: 'Recovery ready',
                  description: 'Safeguard your keys with elegant recovery workflows.',
                  icon: <ShieldCheck className="h-5 w-5" />,
                },
                {
                  title: 'Made for teams',
                  description: 'Group spaces that feel high-touch and beautifully minimal.',
                  icon: <Image src="/logo.png" alt="Lingo" width={28} height={28} className="rounded-xl" />,
                },
              ].map(({ title, description, icon }) => (
                <div key={title} className="rounded-[22px] border border-white/30 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:shadow-[0_18px_46px_rgba(3,8,25,0.35)]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary-500/12 via-primary-400/10 to-accent-400/12 text-primary-600 dark:text-primary-200">
                      {icon}
                    </span>
                    <div>
                      <p className="font-display text-base text-slate-900 dark:text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-br from-primary-500/15 via-transparent to-accent-400/15 blur-3xl" />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
              className="relative rounded-[32px] border border-white/35 bg-white/95 p-10 shadow-[0_28px_60px_rgba(31,41,120,0.22)] backdrop-blur-xl dark:border-white/12 dark:bg-[rgba(17,24,54,0.88)] dark:shadow-[0_30px_70px_rgba(3,8,25,0.48)]"
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
                      className="w-full rounded-[18px] border border-white/35 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/15 dark:bg-white/12 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
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
                        className="w-full appearance-none rounded-[18px] border border-white/35 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/15 dark:bg-white/12 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
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
                  className="w-full rounded-[18px] border border-white/35 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/15 dark:bg-white/12 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
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
                  className="w-full rounded-[18px] border border-white/35 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-200/70 dark:border-white/15 dark:bg-white/12 dark:text-slate-100 dark:focus:border-primary-500 dark:focus:ring-primary-700/40"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-[20px] bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 focus:ring-primary-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <span className="relative">
                  {loading ? 'Just a sec…' : isSignUp ? 'Join Lingo' : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-300">
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
