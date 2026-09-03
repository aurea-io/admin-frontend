export type ModuleCatalogKind = 'module' | 'page' | 'feature';

export type ModuleCatalogStatus = 'draft' | 'active' | 'toBeDeprecated' | 'deprecated';

export interface ModuleAvailability {
  plans?: string[];
  requiresSubscription?: boolean;
}

export interface ModuleCompatibility {
  minVersion?: string;
  maxVersion?: string;
}

export interface ModuleCatalogEntry {
  id: string;
  key: string;
  kind: ModuleCatalogKind;
  moduleKey: string;
  sectionKey: string;
  pageKey?: string | null;
  scope: string;
  name: string;
  description?: string | null;
  status: ModuleCatalogStatus;
  isArchived: boolean;
  maintenanceEnabled: boolean;
  maintenanceMessage?: string | null;
  maintenanceStartsAt?: string | null;
  maintenanceEndsAt?: string | null;
  maintenanceChangedBy?: string | null;
  version: number;
  dependencies: string[];
  requiredPermissions: string[];
  availability?: ModuleAvailability | null;
  compatibility?: ModuleCompatibility | null;
  metadata?: Record<string, unknown> | null;
  ownerTeam?: string | null;
  manifest?: string | null;
  autoDiscovered?: boolean;
  catalogVersion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleTree {
  [sectionKey: string]: {
    [pageKey: string]: ModuleCatalogEntry[];
  };
}

export interface CreateModuleDto {
  key: string;
  kind: ModuleCatalogKind;
  moduleKey: string;
  sectionKey: string;
  pageKey?: string;
  scope?: string;
  name: string;
  description?: string;
  dependencies?: string[];
  requiredPermissions?: string[];
  availablePlans?: string[];
  requiresSubscription?: boolean;
  ownerTeam?: string;
  manifest?: string;
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  scope?: string;
  dependencies?: string[];
  requiredPermissions?: string[];
  availablePlans?: string[];
  requiresSubscription?: boolean;
  ownerTeam?: string;
  manifest?: string;
}

export interface UpdateModuleStatusDto {
  status: ModuleCatalogStatus;
  maintenanceEnabled?: boolean;
  maintenanceMessage?: string;
  maintenanceStartsAt?: string;
  maintenanceEndsAt?: string;
}

export interface ModuleFilterParams {
  kind?: ModuleCatalogKind;
  status?: ModuleCatalogStatus;
  sectionKey?: string;
}
