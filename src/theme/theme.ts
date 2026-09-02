export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'aurea-theme';

export const DEFAULT_THEME: ThemeMode = 'light';

export function resolveInitialTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
