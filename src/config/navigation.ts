import type { PlatformRole } from '../types/auth';

export interface NavItem {
  id: string;
  label: string;
  iconType: 'plans' | 'tenants' | 'modules' | 'maintenance' | 'audit' | 'dashboard';
  href: string;
  scope: 'platform' | 'tenant';
  requiredRole?: PlatformRole | PlatformRole[];
  requiredCapability?: string;
  badge?: string;
}

export const PLATFORM_NAV_CONFIG: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    iconType: 'dashboard',
    href: '/platform/dashboard',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'plans',
    label: 'Planes y membresías',
    iconType: 'plans',
    href: '/platform/plans',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'tenants',
    label: 'Tenants',
    iconType: 'tenants',
    href: '/platform/tenants',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'modules',
    label: 'Módulos y funciones',
    iconType: 'modules',
    href: '/platform/modules',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'maintenance',
    label: 'Mantenimiento',
    iconType: 'maintenance',
    href: '/platform/maintenance',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
  },
  {
    id: 'audit',
    label: 'Auditoría',
    iconType: 'audit',
    href: '/platform/audit',
    scope: 'platform',
    requiredRole: ['platform_owner', 'platform_operator'],
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
