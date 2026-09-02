export type PlatformRole = 'platform_owner' | 'platform_operator';
export type Scope = 'platform' | 'tenant';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: PlatformRole;
  allowedFeatures: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSession;
}

export interface CapabilitiesResponse {
  [key: string]: boolean;
}

export type LoginError = 'invalid_credentials' | 'user_inactive' | 'network_error' | 'unknown_error';
