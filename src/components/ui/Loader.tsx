export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`loader loader--${size}`} aria-label="Cargando" />;
}
