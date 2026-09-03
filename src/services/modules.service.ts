import api from '../lib/api';
import type {
  ModuleCatalogEntry,
  ModuleTree,
  CreateModuleDto,
  UpdateModuleDto,
  UpdateModuleStatusDto,
  ModuleFilterParams,
} from '../types/modules';

export const modulesService = {
  async getTree(): Promise<ModuleTree> {
    const { data } = await api.get<ModuleTree>('/modules/tree');
    return data;
  },

  async findAll(params?: ModuleFilterParams): Promise<ModuleCatalogEntry[]> {
    const { data } = await api.get<ModuleCatalogEntry[]>('/modules', { params });
    return data;
  },

  async findByKey(key: string): Promise<ModuleCatalogEntry> {
    const { data } = await api.get<ModuleCatalogEntry>(`/modules/${encodeURIComponent(key)}`);
    return data;
  },

  async create(dto: CreateModuleDto): Promise<ModuleCatalogEntry> {
    const { data } = await api.post<ModuleCatalogEntry>('/modules', dto);
    return data;
  },

  async update(key: string, dto: UpdateModuleDto): Promise<ModuleCatalogEntry> {
    const { data } = await api.patch<ModuleCatalogEntry>(`/modules/${encodeURIComponent(key)}`, dto);
    return data;
  },

  async updateStatus(key: string, dto: UpdateModuleStatusDto): Promise<ModuleCatalogEntry> {
    const { data } = await api.patch<ModuleCatalogEntry>(`/modules/${encodeURIComponent(key)}/status`, dto);
    return data;
  },

  async archive(key: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/modules/${encodeURIComponent(key)}`);
    return data;
  },
};
