import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { preferenceStorage } from '../lib/safeStorage';
import {
  applyColorTheme, getSystemTheme, parseThemePreference, readThemePreference, THEME_STORAGE_KEY,
  type ColorTheme, type ThemePreference,
} from '../lib/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ColorTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(readThemePreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const theme = preference === 'system' ? systemTheme : preference;

  useLayoutEffect(() => {
    applyColorTheme(preference, theme);
  }, [preference, theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setPreferenceState(parseThemePreference(event.newValue));
      } else if (event.key === null) {
        // Another tab cleared local preferences.
        setPreferenceState(readThemePreference());
      }
    };
    onSystemChange();
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    theme,
    setPreference(next) {
      preferenceStorage.setItem(THEME_STORAGE_KEY, next);
      setPreferenceState(next);
    },
  }), [preference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('Theme controls must be inside ThemeProvider');
  return context;
}
