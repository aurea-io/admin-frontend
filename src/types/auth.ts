export type Role = 'platform_owner' | 'platform_operator';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  allowedFeatures: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSession;
}
