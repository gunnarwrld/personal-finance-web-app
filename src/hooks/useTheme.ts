import { useEffect, useState } from 'react';
import { storage } from '@/lib/utils';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return storage.get<Theme>('theme', 'light');
  });

  const setTheme = (newTheme: Theme) => {
    storage.set('theme', newTheme);
    setThemeState(newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme: () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    },
  };
}
