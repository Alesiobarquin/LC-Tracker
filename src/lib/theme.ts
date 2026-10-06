import { preferenceStorage } from './safeStorage';

export const THEME_STORAGE_KEY = 'lc-tracker-theme';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorTheme = 'light' | 'dark';

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function readThemePreference(): ThemePreference {
  return parseThemePreference(preferenceStorage.getItem(THEME_STORAGE_KEY));
}

export function getSystemTheme(): ColorTheme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyColorTheme(preference: ThemePreference, theme: ColorTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  const canvas = theme === 'dark' ? '#0e1419' : '#f6f8fa';
  root.style.backgroundColor = `var(--palette-canvas, ${canvas})`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas);
}
