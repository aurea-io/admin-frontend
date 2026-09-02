export interface PlatformTenant {
  id: string;
  slug: string;
  name: string;
  vertical: string;
  isActive: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string | null;
  createdAt: string;
}

export interface PlatformPlan {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  includedFeatures: string[];
  isActive: boolean;
}

export interface PlatformFeature {
  id: string;
  key: string;
  label: string;
  description?: string | null;
}
