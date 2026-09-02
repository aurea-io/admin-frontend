const defaultApiUrl = 'http://localhost:3002/api/v1';
const configuredApiUrl = import.meta.env.VITE_API_URL ?? defaultApiUrl;
const parsedApiUrl = new URL(configuredApiUrl);
const isLocalDevelopment =
  import.meta.env.DEV &&
  ['localhost', '127.0.0.1', '::1'].includes(parsedApiUrl.hostname);

if (parsedApiUrl.protocol !== 'https:' && !isLocalDevelopment) {
  throw new Error('VITE_API_URL must use HTTPS outside local development');
}

export const env = {
  apiUrl: parsedApiUrl.toString().replace(/\/$/, ''),
  appName: import.meta.env.VITE_APP_NAME ?? 'Backoffice Aurea',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
};
