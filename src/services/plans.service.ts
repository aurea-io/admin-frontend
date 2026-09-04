import api from '../lib/api';
import type {
  PlatformPlan,
  CreatePlanDto,
  UpdatePlanDto,
  UpdatePlanStatusDto,
  FindPlansQuery,
  PaginatedPlansResult,
} from '../types/plans';

export const plansService = {
  async findAll(params?: FindPlansQuery): Promise<PaginatedPlansResult | PlatformPlan[]> {
    const { data } = await api.get<PaginatedPlansResult | PlatformPlan[]>('/platform/plans', { params });
    return data;
  },

  async findByIdOrKey(idOrKey: string): Promise<PlatformPlan> {
    const { data } = await api.get<PlatformPlan>(`/platform/plans/${encodeURIComponent(idOrKey)}`);
    return data;
  },

  async create(dto: CreatePlanDto): Promise<PlatformPlan> {
    const { data } = await api.post<PlatformPlan>('/platform/plans', dto);
    return data;
  },

  async update(idOrKey: string, dto: UpdatePlanDto): Promise<PlatformPlan> {
    const { data } = await api.patch<PlatformPlan>(`/platform/plans/${encodeURIComponent(idOrKey)}`, dto);
    return data;
  },

  async updateStatus(idOrKey: string, dto: UpdatePlanStatusDto): Promise<PlatformPlan> {
    const { data } = await api.patch<PlatformPlan>(`/platform/plans/${encodeURIComponent(idOrKey)}/status`, dto);
    return data;
  },

  async archive(idOrKey: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/platform/plans/${encodeURIComponent(idOrKey)}`);
    return data;
  },
};
