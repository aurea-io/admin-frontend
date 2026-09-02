import { useThemeMode } from '../../hooks/useThemeMode';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span className="theme-toggle__label">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
