import { useState } from 'react';
import { storage } from '@/lib/utils';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  const stored = storage.get<Theme | null>(THEME_STORAGE_KEY, null);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Called once at startup, before React renders. */
export function applyStoredTheme() {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (newTheme: Theme) => {
    storage.set(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme: () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    },
  };
}
