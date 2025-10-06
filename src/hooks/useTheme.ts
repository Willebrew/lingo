import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useStore();

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('lingo-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, [setTheme]);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('lingo-theme', theme);
  }, [theme]);

  return { theme, toggleTheme };
}
