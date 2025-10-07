import { useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';

export function useTheme() {
  const { theme, setTheme } = useStore();

  useEffect(() => {
    // Force light mode for now and persist the preference.
    setTheme('light');
    localStorage.setItem('lingo-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.dataset.theme = 'light';
  }, [setTheme]);

  // We still expose a toggle handler so existing callers do not break,
  // but it now no-ops to keep the UI locked to light mode.
  const disabledToggle = useMemo(() => () => {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('lingo-theme', 'light');
  }, [setTheme]);

  return { theme: 'light', toggleTheme: disabledToggle };
}
