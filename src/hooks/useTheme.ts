import { useEffect } from 'react';
import { storage } from '@/lib/utils';

type Theme = 'light' | 'dark';

export function useTheme() {
  const getTheme = (): Theme => {
    const stored = storage.get<Theme>('theme', 'light');
    return stored;
  };

  const setTheme = (theme: Theme) => {
    storage.set('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const theme = getTheme();
    setTheme(theme);
  }, []);

  return {
    theme: getTheme(),
    setTheme,
    toggleTheme: () => {
      const current = getTheme();
      setTheme(current === 'dark' ? 'light' : 'dark');
    },
  };
}
