import api from '../lib/api';
import type { PlatformFeature, PlatformPlan, PlatformTenant } from '../types/platform';

export const platformService = {
  async getTenants() { return (await api.get<PlatformTenant[]>('/platform/tenants')).data; },
  async getPlans() { return (await api.get<PlatformPlan[]>('/platform/plans')).data; },
  async getFeatures() { return (await api.get<PlatformFeature[]>('/platform/features')).data; },
};
