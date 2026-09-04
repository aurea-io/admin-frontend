export type PlanStatus = 'draft' | 'active' | 'archived';

export type PlanBillingInterval = 'monthly' | 'yearly' | 'quarterly' | 'one_time';

export interface PlanPrice {
  currency: string;
  amount: number;
  interval: PlanBillingInterval;
  isActive?: boolean;
}

export interface PlanCredits {
  monthly: number;
  rollover?: boolean;
}

export interface PlanLimits {
  maxUsers?: number;
  maxBranches?: number;
  storageGb?: number;
  apiRateLimit?: number;
  customLimits?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

export interface PlanDiscount {
  enabled: boolean;
  percentage?: number;
  durationMonths?: number;
}

export interface PlatformPlan {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: PlanStatus;
  displayOrder: number;
  includedFeatures: string[];
  prices: PlanPrice[];
  credits?: PlanCredits;
  limits?: PlanLimits;
  discount?: PlanDiscount;
  trialDays?: number;
  gracePeriodDays?: number;
  isPopular?: boolean;
  isCustom?: boolean;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDto {
  key: string;
  name: string;
  description?: string;
  status?: PlanStatus;
  displayOrder?: number;
  includedFeatures?: string[];
  prices?: PlanPrice[];
  credits?: PlanCredits;
  limits?: PlanLimits;
  discount?: PlanDiscount;
  trialDays?: number;
  gracePeriodDays?: number;
  isPopular?: boolean;
  isCustom?: boolean;
  isActive?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  status?: PlanStatus;
  displayOrder?: number;
  includedFeatures?: string[];
  prices?: PlanPrice[];
  credits?: PlanCredits;
  limits?: PlanLimits;
  discount?: PlanDiscount;
  trialDays?: number;
  gracePeriodDays?: number;
  isPopular?: boolean;
  isCustom?: boolean;
  isActive?: boolean;
}

export interface UpdatePlanStatusDto {
  status: PlanStatus;
}

export interface FindPlansQuery {
  status?: PlanStatus;
  search?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'displayOrder' | 'name' | 'createdAt' | 'key' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPlansResult {
  data: PlatformPlan[];
  total: number;
  limit: number;
  offset: number;
}
