/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number | boolean>): void;
  cancel(): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface Window {
  google?: { accounts: GoogleAccounts };
}
