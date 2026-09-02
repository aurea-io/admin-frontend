import type { PlatformRole } from '../types/auth';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  scope: 'platform' | 'tenant';
  requiredRole?: PlatformRole | PlatformRole[];
  requiredCapability?: string;
  badge?: string;
}

export const PLATFORM_NAV_CONFIG: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Resumen',
    icon: '◫',
    href: '/platform/dashboard',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'tenants',
    label: 'Tenants',
    icon: '▦',
    href: '/platform/tenants',
    scope: 'platform',
    requiredRole: 'platform_owner',
    requiredCapability: 'platform.tenants.read',
  },
];

export function filterNavByRole(items: NavItem[], userRole: PlatformRole): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredRole) return true;
    
    const roles = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
    return roles.includes(userRole);
  });
}

export function filterNavByCapability(items: NavItem[], hasCapability: (key: string) => boolean): NavItem[] {
  return items.filter((item) => {
    if (!item.requiredCapability) return true;
    return hasCapability(item.requiredCapability);
  });
}
