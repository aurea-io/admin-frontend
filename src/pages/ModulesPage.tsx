import { useState, useEffect, useMemo, useId } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../stores/authStore';
import { modulesService } from '../services/modules.service';
import { CANONICAL_SECTIONS, INITIAL_CANONICAL_ENTRIES, type SectionMeta } from '../config/canonicalCatalog';
import type {
  ModuleCatalogEntry,
  ModuleCatalogKind,
  ModuleCatalogStatus,
  CreateModuleDto,
  UpdateModuleDto,
} from '../types/modules';

export function ModulesPage() {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'platform_owner';

  const [entries, setEntries] = useState<ModuleCatalogEntry[]>(INITIAL_CANONICAL_ENTRIES);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleCatalogEntry | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configActiveTab, setConfigActiveTab] = useState<'general' | 'dependencies' | 'lifecycle'>('general');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKindFilter, setSelectedKindFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // UI state for async actions & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New module form state (Nivel 1 Sección -> Nivel 2 Página -> Nivel 3 Módulo/Función)
  const [createSection, setCreateSection] = useState('services');
  const [createPage, setCreatePage] = useState('bookings');
  const [createModuleKey, setCreateModuleKey] = useState('');
  const [createName, setCreateName] = useState('');
  const [createKind, setCreateKind] = useState<ModuleCatalogKind>('feature');
  const [createDesc, setCreateDesc] = useState('');
  const [createScope, setCreateScope] = useState<'tenant' | 'platform' | 'public'>('tenant');
  const [createOwnerTeam, setCreateOwnerTeam] = useState('services-team');

  // Calculated canonical namespace
  const calculatedNamespace = useMemo(() => {
    const sec = createSection.trim().toLowerCase();
    const pag = createPage.trim().toLowerCase();
    const mod = createModuleKey.trim().toLowerCase();
    if (pag && mod) return `${sec}.${pag}.${mod}`;
    if (pag) return `${sec}.${pag}`;
    return sec;
  }, [createSection, createPage, createModuleKey]);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateModuleDto>({
    name: '',
    description: '',
    scope: 'tenant',
    dependencies: [],
    requiredPermissions: [],
    availablePlans: [],
    requiresSubscription: true,
    ownerTeam: '',
    manifest: '',
  });

  const [statusForm, setStatusForm] = useState<{
    status: ModuleCatalogStatus;
    maintenanceEnabled: boolean;
    maintenanceMessage: string;
  }>({
    status: 'active',
    maintenanceEnabled: false,
    maintenanceMessage: '',
  });

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (isConfigModalOpen || isCreateModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isConfigModalOpen, isCreateModalOpen]);

  // Load entries from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const data = await modulesService.findAll();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setEntries(data);
        }
      } catch {
        // Silent fallback to canonical catalog
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openConfigModal = (entry: ModuleCatalogEntry) => {
    setSelectedModule(entry);
    setConfigActiveTab('general');
    setEditForm({
      name: entry.name,
      description: entry.description ?? '',
      scope: entry.scope,
      dependencies: entry.dependencies ?? [],
      requiredPermissions: entry.requiredPermissions ?? [],
      availablePlans: entry.availability?.plans ?? ['Estándar', 'Plan Pro'],
      requiresSubscription: entry.availability?.requiresSubscription ?? true,
      ownerTeam: entry.ownerTeam ?? '',
      manifest: entry.manifest ?? '',
    });
    setStatusForm({
      status: entry.status,
      maintenanceEnabled: entry.maintenanceEnabled ?? false,
      maintenanceMessage: entry.maintenanceMessage ?? '',
    });
    setIsConfigModalOpen(true);
  };

  const closeConfigModal = () => {
    setIsConfigModalOpen(false);
  };

  // KPIs
  const totalCount = entries.length;
  const activeCount = entries.filter((e) => e.status === 'active' && !e.maintenanceEnabled).length;
  const maintenanceCount = entries.filter((e) => e.maintenanceEnabled).length;
  const deprecatedCount = entries.filter((e) => e.status === 'deprecated' || e.status === 'toBeDeprecated').length;

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // If a section is selected in drill-down mode, enforce it
      if (selectedSection && item.sectionKey !== selectedSection) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesKey = item.key.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description ?? '').toLowerCase().includes(q);
        if (!matchesKey && !matchesName && !matchesDesc) return false;
      }

      // Kind filter
      if (selectedKindFilter !== 'all' && item.kind !== selectedKindFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'maintenance') {
          if (!item.maintenanceEnabled) return false;
        } else if (item.status !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedSection, searchQuery, selectedKindFilter, selectedStatusFilter]);

  // Group filtered entries by Page (Nivel 2)
  const pagesMap = useMemo(() => {
    const map: Record<string, ModuleCatalogEntry[]> = {};
    for (const entry of filteredEntries) {
      const page = entry.pageKey || '_general';
      if (!map[page]) map[page] = [];
      map[page].push(entry);
    }
    return map;
  }, [filteredEntries]);

  // Section summary stats (Pages count + Modules count)
  const getSectionStats = (sectionKey: string) => {
    const secEntries = entries.filter((e) => e.sectionKey === sectionKey);
    const pagesSet = new Set(secEntries.map((e) => e.pageKey).filter(Boolean));
    const active = secEntries.filter((e) => e.status === 'active' && !e.maintenanceEnabled).length;
    const maintenance = secEntries.filter((e) => e.maintenanceEnabled).length;
    return {
      totalModules: secEntries.length,
      totalPages: pagesSet.size || 1,
      active,
      maintenance,
    };
  };

  // Handle Save
  const handleSaveEntry = async () => {
    if (!selectedModule || !isOwner) return;
    setIsSaving(true);

    try {
      // Update metadata
      const updated = await modulesService.update(selectedModule.key, {
        name: editForm.name,
        description: editForm.description,
        scope: editForm.scope,
        dependencies: editForm.dependencies,
        requiredPermissions: editForm.requiredPermissions,
        availablePlans: editForm.availablePlans,
        requiresSubscription: editForm.requiresSubscription,
        ownerTeam: editForm.ownerTeam,
        manifest: editForm.manifest,
      }).catch(() => null);

      // Update status & maintenance
      if (
        statusForm.status !== selectedModule.status ||
        statusForm.maintenanceEnabled !== selectedModule.maintenanceEnabled ||
        statusForm.maintenanceMessage !== (selectedModule.maintenanceMessage ?? '')
      ) {
        await modulesService.updateStatus(selectedModule.key, {
          status: statusForm.status,
          maintenanceEnabled: statusForm.maintenanceEnabled,
          maintenanceMessage: statusForm.maintenanceMessage,
        }).catch(() => null);
      }

      // Update local state
      setEntries((prev) =>
        prev.map((e) => {
          if (e.key === selectedModule.key) {
            const updatedItem: ModuleCatalogEntry = {
              ...e,
              ...(updated ?? {}),
              name: editForm.name ?? e.name,
              description: editForm.description ?? e.description,
              scope: editForm.scope ?? e.scope,
              dependencies: editForm.dependencies ?? e.dependencies,
              requiredPermissions: editForm.requiredPermissions ?? e.requiredPermissions,
              availability: {
                plans: editForm.availablePlans ?? e.availability?.plans ?? [],
                requiresSubscription: editForm.requiresSubscription ?? e.availability?.requiresSubscription ?? true,
              },
              ownerTeam: editForm.ownerTeam ?? e.ownerTeam,
              manifest: editForm.manifest ?? e.manifest,
              status: statusForm.status,
              maintenanceEnabled: statusForm.maintenanceEnabled,
              maintenanceMessage: statusForm.maintenanceMessage,
              version: (e.version || 1) + 1,
              updatedAt: new Date().toISOString(),
            };
            setSelectedModule(updatedItem);
            return updatedItem;
          }
          return e;
        })
      );

      setIsConfigModalOpen(false);
      showToast(`Módulo '${selectedModule.key}' guardado con éxito.`);
    } catch {
      showToast('Error al actualizar módulo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Archive
  const handleArchive = async () => {
    if (!selectedModule || !isOwner) return;
    if (!window.confirm(`¿Estás seguro de archivar '${selectedModule.key}'?`)) return;

    try {
      await modulesService.archive(selectedModule.key).catch(() => null);
      setEntries((prev) => prev.filter((e) => e.key !== selectedModule.key));
      setIsConfigModalOpen(false);
      setSelectedModule(null);
      showToast(`Módulo '${selectedModule.key}' archivado.`);
    } catch {
      showToast('Error al archivar el módulo.');
    }
  };

  // Handle Create Module / Feature
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedNamespace || !createName.trim() || !isOwner) return;

    const payload: CreateModuleDto = {
      key: calculatedNamespace,
      kind: createKind,
      moduleKey: createModuleKey.trim().toLowerCase() || createPage.trim().toLowerCase(),
      sectionKey: createSection,
      pageKey: createPage.trim().toLowerCase() || null,
      scope: createScope,
      name: createName.trim(),
      description: createDesc.trim() || undefined,
      dependencies: [],
      requiredPermissions: [],
      availablePlans: ['Estándar', 'Plan Pro'],
      requiresSubscription: true,
      ownerTeam: createOwnerTeam,
      manifest: `src/tenant/sections/${createSection}/${createPage || createModuleKey}`,
    };

    try {
      const created = await modulesService.create(payload).catch(() => null);
      const newEntry: ModuleCatalogEntry = created ?? {
        id: `custom-${Date.now()}`,
        key: payload.key,
        kind: payload.kind,
        moduleKey: payload.moduleKey,
        sectionKey: payload.sectionKey,
        pageKey: payload.pageKey || null,
        scope: payload.scope || 'tenant',
        name: payload.name,
        description: payload.description || null,
        status: 'draft',
        isArchived: false,
        maintenanceEnabled: false,
        version: 1,
        dependencies: payload.dependencies ?? [],
        requiredPermissions: payload.requiredPermissions ?? [],
        availability: {
          plans: payload.availablePlans ?? ['Estándar', 'Plan Pro'],
          requiresSubscription: payload.requiresSubscription ?? true,
        },
        ownerTeam: payload.ownerTeam || null,
        manifest: payload.manifest || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setEntries((prev) => [newEntry, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedSection(newEntry.sectionKey);
      openConfigModal(newEntry);
      showToast(`Nuevo módulo '${newEntry.key}' registrado con éxito.`);
    } catch {
      showToast('Error al crear el módulo.');
    }
  };

  const addDependency = (depKey: string) => {
    if (!depKey || editForm.dependencies?.includes(depKey)) return;
    setEditForm((prev) => ({
      ...prev,
      dependencies: [...(prev.dependencies ?? []), depKey],
    }));
  };

  const removeDependency = (depKey: string) => {
    setEditForm((prev) => ({
      ...prev,
      dependencies: (prev.dependencies ?? []).filter((d) => d !== depKey),
    }));
  };

  const [newPermInput, setNewPermInput] = useState('');
  const addPermission = () => {
    if (!newPermInput.trim()) return;
    const clean = newPermInput.trim().toLowerCase();
    if (!editForm.requiredPermissions?.includes(clean)) {
      setEditForm((prev) => ({
        ...prev,
        requiredPermissions: [...(prev.requiredPermissions ?? []), clean],
      }));
    }
    setNewPermInput('');
  };

  const removePermission = (perm: string) => {
    setEditForm((prev) => ({
      ...prev,
      requiredPermissions: (prev.requiredPermissions ?? []).filter((p) => p !== perm),
    }));
  };

  const renderSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'shopping-cart':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      case 'utensils':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 2v20M6 2v20M2 7h8a4 4 0 0 1-8 0z" />
          </svg>
        );
      case 'users':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'tag':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  const formNameId = useId();
  const formDescId = useId();
  const formScopeId = useId();
  const formStatusId = useId();
  const formMaintId = useId();
  const formOwnerId = useId();
  const formManifestId = useId();

  const isBrowsingAll = !selectedSection && !searchQuery.trim();
  const currentSectionMeta: SectionMeta | null = selectedSection
    ? CANONICAL_SECTIONS[selectedSection] ?? {
        key: selectedSection,
        name: selectedSection.toUpperCase(),
        description: '',
        icon: 'folder',
      }
    : null;

  return (
    <AppShell>
      {/* Encabezado principal */}
      <div className="page-header">
        <div className="page-header__content">
          <h1>Catálogo de Secciones, Páginas y Módulos</h1>
          <p>
            Jerarquía canónica en 3 niveles: <strong>Sección</strong> (Macro-área) → <strong>Página</strong> (Pantalla UI) → <strong>Módulo / Función</strong> (Feature activable).
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            id="btn-add-module"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo Módulo / Feature</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas / KPIs */}
      <div className="catalog-metrics-grid">
        <div className="catalog-metric-card">
          <div className="catalog-metric-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <div className="catalog-metric-content">
            <span className="catalog-metric-value">{totalCount}</span>
            <span className="catalog-metric-label">Módulos & Funciones (Nivel 3)</span>
          </div>
        </div>

        <div className="catalog-metric-card">
          <div className="catalog-metric-icon catalog-metric-icon--active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="catalog-metric-content">
            <span className="catalog-metric-value">{activeCount}</span>
            <span className="catalog-metric-label">Funciones Activas</span>
          </div>
        </div>

        <div className="catalog-metric-card">
          <div className="catalog-metric-icon catalog-metric-icon--warning">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="catalog-metric-content">
            <span className="catalog-metric-value">{maintenanceCount}</span>
            <span className="catalog-metric-label">En Mantenimiento</span>
          </div>
        </div>

        <div className="catalog-metric-card">
          <div className="catalog-metric-icon catalog-metric-icon--danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="catalog-metric-content">
            <span className="catalog-metric-value">{deprecatedCount}</span>
            <span className="catalog-metric-label">Deprecadas / Transición</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="catalog-filter-bar">
        <div className="catalog-search-row">
          <div className="catalog-search-input-wrapper">
            <svg
              className="catalog-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Buscar por namespace (ej: services.bookings.photo_upload) o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="catalog-search-input"
            />
          </div>

          <div className="catalog-filter-selects">
            <select
              className="catalog-select"
              value={selectedKindFilter}
              onChange={(e) => setSelectedKindFilter(e.target.value)}
              aria-label="Filtrar por tipo"
            >
              <option value="all">Todos los Tipos</option>
              <option value="module">Módulo (Núcleo)</option>
              <option value="page">Página (Pantalla)</option>
              <option value="feature">Feature / Función</option>
            </select>

            <select
              className="catalog-select"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="draft">Borrador (Draft)</option>
              <option value="toBeDeprecated">Por Deprecar</option>
              <option value="deprecated">Deprecados</option>
              <option value="maintenance">En Mantenimiento</option>
            </select>
          </div>
        </div>

        {/* Category Pills Navigation (Macro-Secciones Nivel 1) */}
        <div className="catalog-section-pills">
          <button
            type="button"
            className={`catalog-pill ${selectedSection === null ? 'catalog-pill--active' : ''}`}
            onClick={() => setSelectedSection(null)}
          >
            Todas las Secciones (Hub Nivel 1)
          </button>
          {Object.entries(CANONICAL_SECTIONS).map(([sKey, sData]) => (
            <button
              key={sKey}
              type="button"
              className={`catalog-pill ${selectedSection === sKey ? 'catalog-pill--active' : ''}`}
              onClick={() => setSelectedSection(sKey)}
            >
              <span>{sData.name}</span>
            </button>
          ))}
        </div>
      </div>

      {toastMessage && <div className="toast-feedback">{toastMessage}</div>}

      {/* VISTA 1: HUB DE SECCIONES (NIVEL 1) */}
      {isBrowsingAll ? (
        <div className="section-cards-grid">
          {Object.entries(CANONICAL_SECTIONS).map(([sKey, sData]) => {
            const stats = getSectionStats(sKey);
            return (
              <div
                key={sKey}
                className="section-card"
                onClick={() => setSelectedSection(sKey)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedSection(sKey);
                }}
              >
                <div>
                  <div className="section-card__top">
                    <div className="section-card__icon-box">{renderSectionIcon(sData.icon)}</div>
                    <span className="tree-count-badge">
                      {stats.totalPages} {stats.totalPages === 1 ? 'Página' : 'Páginas'} · {stats.totalModules} Módulos
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 className="section-card__name">{sData.name}</h3>
                    <span className="feature-row-item__key">{sKey}</span>
                  </div>
                  <p className="section-card__desc">{sData.description}</p>
                </div>

                <div className="section-card__footer">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="status-badge status-badge--active">{stats.active} activas</span>
                    {stats.maintenance > 0 && (
                      <span className="maintenance-badge">{stats.maintenance} mant.</span>
                    )}
                  </div>
                  <span className="section-card__cta">
                    <span>Explorar Páginas</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: DRILL-DOWN ENFOCADO (NIVEL 2: PÁGINAS Y NIVEL 3: MÓDULOS) */
        <div className="page-groups-container">
          <div className="catalog-breadcrumb-bar">
            <div className="catalog-breadcrumb">
              <button
                type="button"
                className="catalog-back-btn"
                onClick={() => setSelectedSection(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver a Secciones</span>
              </button>
              <span style={{ color: 'var(--color-text-muted)' }}>/</span>
              <strong>Sección: {currentSectionMeta?.name ?? 'Búsqueda Global'}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>
                ({filteredEntries.length} funciones encontradas)
              </span>
            </div>

            {isLoading && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-brand)' }}>Sincronizando catálogo...</span>
            )}
          </div>

          {Object.keys(pagesMap).length === 0 ? (
            <div
              className="page-group-card"
              style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-soft)' }}
            >
              <p>No se encontraron módulos o funciones con los criterios aplicados.</p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedKindFilter('all');
                  setSelectedStatusFilter('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            Object.entries(pagesMap).map(([pageKey, pageEntries]) => {
              const displayPageName = pageKey === '_general' ? 'Módulos Generales de la Sección' : `Página: ${pageKey}`;
              const sectionKeyForPath = selectedSection || pageEntries[0]?.sectionKey || 'services';
              const physicalPath = `src/tenant/sections/${sectionKeyForPath}/${pageKey === '_general' ? '' : pageKey}`;

              return (
                <div key={pageKey} className="page-group-card">
                  <div className="page-group-card__header">
                    <div>
                      <h3 className="page-group-card__title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                        </svg>
                        <span>{displayPageName} (Nivel 2)</span>
                      </h3>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)', marginTop: '2px', display: 'inline-block' }}>
                        Carpeta física: <code>{physicalPath}</code>
                      </span>
                    </div>
                    <span className="tree-count-badge">{pageEntries.length} funciones</span>
                  </div>

                  <div className="feature-rows-list">
                    {pageEntries.map((entry) => (
                      <div
                        key={entry.key}
                        className="feature-row-item"
                        onClick={() => openConfigModal(entry)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openConfigModal(entry);
                        }}
                      >
                        <div className="feature-row-item__info">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h4 className="feature-row-item__title">{entry.name}</h4>
                              <span className="feature-row-item__key">{entry.key}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                              {entry.description || 'Sin descripción detallada.'}
                            </p>
                          </div>
                        </div>

                        <div className="feature-row-item__actions">
                          <span className={`kind-badge kind-badge--${entry.kind}`}>
                            {entry.kind === 'feature' ? 'Función' : entry.kind === 'module' ? 'Módulo' : 'Página'}
                          </span>
                          <span className={`status-badge status-badge--${entry.status}`}>{entry.status}</span>
                          {entry.maintenanceEnabled && (
                            <span className="maintenance-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                              </svg>
                              Mantenimiento
                            </span>
                          )}
                          <button
                            type="button"
                            className="btn-configure-module"
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfigModal(entry);
                            }}
                            aria-label={`Configurar ${entry.name}`}
                          >
                            <svg
                              className="btn-configure-icon"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>Configurar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN DEL MÓDULO (NIVEL 3) */}
      {isConfigModalOpen && selectedModule && (
        <div className="catalog-modal-overlay" onClick={closeConfigModal}>
          <div
            className="module-config-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header del Modal */}
            <div className="module-config-modal-header">
              <div>
                <span className="feature-row-item__key">{selectedModule.key}</span>
                <h2 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: 'var(--color-text)' }}>
                  {selectedModule.name}
                </h2>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>
                  Sección: <strong>{selectedModule.sectionKey}</strong> · Página: <strong>{selectedModule.pageKey || '(raíz)'}</strong>
                </span>
              </div>
              <button
                type="button"
                className="action-dots-btn"
                onClick={closeConfigModal}
                aria-label="Cerrar modal de configuración"
              >
                ×
              </button>
            </div>

            {/* Pestañas de Navegación del Modal (Segmented 3-Way) */}
            <div className="module-config-modal-tabs">
              <button
                type="button"
                className={`module-config-tab-btn ${configActiveTab === 'general' ? 'module-config-tab-btn--active' : ''}`}
                onClick={() => setConfigActiveTab('general')}
              >
                <span className="tab-label-desktop">1. General & Metadata</span>
                <span className="tab-label-mobile">General</span>
              </button>
              <button
                type="button"
                className={`module-config-tab-btn ${configActiveTab === 'dependencies' ? 'module-config-tab-btn--active' : ''}`}
                onClick={() => setConfigActiveTab('dependencies')}
              >
                <span className="tab-label-desktop">2. Dependencias & Permisos ({editForm.dependencies?.length ?? 0})</span>
                <span className="tab-label-mobile">Permisos ({editForm.dependencies?.length ?? 0})</span>
              </button>
              <button
                type="button"
                className={`module-config-tab-btn ${configActiveTab === 'lifecycle' ? 'module-config-tab-btn--active' : ''}`}
                onClick={() => setConfigActiveTab('lifecycle')}
              >
                <span className="tab-label-desktop">3. Ciclo de Vida & Mantenimiento</span>
                <span className="tab-label-mobile">Estado</span>
              </button>
            </div>

            {/* Cuerpo del Modal con Tabs */}
            <div className="module-config-modal-body">
              {configActiveTab === 'general' && (
                <div className="editor-section">
                  <div className="catalog-modal-grid">
                    <div className="form-group">
                      <label htmlFor={formNameId}>Nombre Descriptivo</label>
                      <input
                        id={formNameId}
                        type="text"
                        className="form-input"
                        value={editForm.name ?? ''}
                        disabled={!isOwner}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={formScopeId}>Scope de Ejecución</label>
                      <select
                        id={formScopeId}
                        className="form-select"
                        value={editForm.scope ?? 'tenant'}
                        disabled={!isOwner}
                        onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                      >
                        <option value="tenant">Tenant (Específico del comercio)</option>
                        <option value="platform">Platform (Global de Aurea)</option>
                        <option value="public">Public (Superficie web pública)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor={formDescId}>Descripción Funcional</label>
                    <textarea
                      id={formDescId}
                      className="form-textarea"
                      style={{ minHeight: '65px' }}
                      value={editForm.description ?? ''}
                      disabled={!isOwner}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="catalog-modal-grid">
                    <div className="form-group">
                      <label htmlFor={formOwnerId}>Equipo Responsable (Owner Team)</label>
                      <input
                        id={formOwnerId}
                        type="text"
                        className="form-input"
                        placeholder="ej: services-team"
                        value={editForm.ownerTeam ?? ''}
                        disabled={!isOwner}
                        onChange={(e) => setEditForm({ ...editForm, ownerTeam: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={formManifestId}>Ubicación Física del Manifiesto / Paquete</label>
                      <input
                        id={formManifestId}
                        type="text"
                        className="form-input"
                        placeholder="src/tenant/sections/services/bookings"
                        value={editForm.manifest ?? ''}
                        disabled={!isOwner}
                        onChange={(e) => setEditForm({ ...editForm, manifest: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {configActiveTab === 'dependencies' && (
                <>
                  <div className="editor-section">
                    <h4 className="editor-section__title">Dependencias Requeridas</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', margin: 0 }}>
                      Otras capabilities o módulos que deben estar activos en el plan para que esta función opere:
                    </p>

                    <div className="tags-container">
                      {(editForm.dependencies ?? []).length === 0 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                          Sin dependencias requeridas.
                        </span>
                      ) : (
                        (editForm.dependencies ?? []).map((dep) => (
                          <span key={dep} className="tag-item">
                            <span>{dep}</span>
                            {isOwner && (
                              <button
                                type="button"
                                className="tag-remove-btn"
                                onClick={() => removeDependency(dep)}
                                aria-label={`Remover dependencia ${dep}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>

                    {isOwner && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.82rem' }}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addDependency(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          aria-label="Agregar dependencia"
                        >
                          <option value="" disabled>
                            + Agregar dependencia del catálogo...
                          </option>
                          {entries
                            .filter((e) => e.key !== selectedModule.key && !editForm.dependencies?.includes(e.key))
                            .map((e) => (
                              <option key={e.key} value={e.key}>
                                {e.key} ({e.name})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="editor-section" style={{ marginTop: '12px' }}>
                    <h4 className="editor-section__title">Permisos Granulares (RBAC)</h4>
                    <div className="tags-container">
                      {(editForm.requiredPermissions ?? []).length === 0 ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                          Sin permisos requeridos (disponible para todos los roles autorizados).
                        </span>
                      ) : (
                        (editForm.requiredPermissions ?? []).map((perm) => (
                          <span key={perm} className="tag-item">
                            <span>{perm}</span>
                            {isOwner && (
                              <button
                                type="button"
                                className="tag-remove-btn"
                                onClick={() => removePermission(perm)}
                                aria-label={`Remover permiso ${perm}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      )}
                    </div>

                    {isOwner && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="ej: bookings:write"
                          style={{ fontSize: '0.82rem' }}
                          value={newPermInput}
                          onChange={(e) => setNewPermInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addPermission();
                            }
                          }}
                        />
                        <button type="button" className="btn-secondary" onClick={addPermission}>
                          Agregar Permiso
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {configActiveTab === 'lifecycle' && (
                <div className="editor-section">
                  <div className="lifecycle-alert">
                    <strong>Regla de Transición Canónica de Ciclo de Vida:</strong>
                    <br />
                    <code>draft → active → toBeDeprecated → deprecated</code>
                  </div>

                  <div className="catalog-modal-grid">
                    <div className="form-group">
                      <label htmlFor={formStatusId}>Estado del Módulo</label>
                      <select
                        id={formStatusId}
                        className="form-select"
                        value={statusForm.status}
                        disabled={!isOwner}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, status: e.target.value as ModuleCatalogStatus })
                        }
                      >
                        <option value="draft">draft (Borrador / Desarrollo)</option>
                        <option value="active">active (Habilitado)</option>
                        <option value="toBeDeprecated">toBeDeprecated (En proceso de deprecación)</option>
                        <option value="deprecated">deprecated (Retirado)</option>
                      </select>
                    </div>

                    <div className="maintenance-box" style={{ justifyContent: 'center' }}>
                      <div
                        className="toggle-switch"
                        onClick={() => {
                          if (isOwner) {
                            setStatusForm({
                              ...statusForm,
                              maintenanceEnabled: !statusForm.maintenanceEnabled,
                            });
                          }
                        }}
                      >
                        <div
                          className={`toggle-switch__track ${
                            statusForm.maintenanceEnabled ? 'toggle-switch__track--active' : ''
                          }`}
                        >
                          <div className="toggle-switch__thumb" />
                        </div>
                        <span
                          className={`toggle-switch__label ${
                            statusForm.maintenanceEnabled ? 'toggle-switch__label--active' : ''
                          }`}
                        >
                          {statusForm.maintenanceEnabled ? 'En Mantenimiento Global' : 'Operación Normal'}
                        </span>
                      </div>

                      {statusForm.maintenanceEnabled && (
                        <div className="form-group" style={{ marginTop: '8px' }}>
                          <label htmlFor={formMaintId}>Mensaje de Mantenimiento para Clientes</label>
                          <input
                            id={formMaintId}
                            type="text"
                            className="form-input"
                            placeholder="Estamos realizando tareas de mantenimiento preventivo..."
                            value={statusForm.maintenanceMessage}
                            disabled={!isOwner}
                            onChange={(e) =>
                              setStatusForm({ ...statusForm, maintenanceMessage: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="module-config-modal-footer">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={handleArchive}
                  >
                    Archivar Módulo
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={closeConfigModal}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveEntry}
                      disabled={isSaving}
                      id="btn-save-module-modal"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <button type="button" className="btn-secondary" onClick={closeConfigModal}>
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN: JERARQUÍA EN 3 NIVELES */}
      {isCreateModalOpen && (
        <div className="catalog-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="catalog-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="catalog-modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Registrar Nuevo Módulo o Función</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                  Estructura canónica: <code>&lt;sección&gt;.&lt;página&gt;.&lt;módulo&gt;</code>
                </span>
              </div>
              <button
                type="button"
                className="action-dots-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateModule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nivel 1 & Nivel 2 */}
              <div className="catalog-modal-grid">
                <div className="form-group">
                  <label>1. Sección (Nivel 1 Macro-área) *</label>
                  <select
                    className="form-select"
                    value={createSection}
                    onChange={(e) => setCreateSection(e.target.value)}
                  >
                    {Object.entries(CANONICAL_SECTIONS).map(([sKey, sData]) => (
                      <option key={sKey} value={sKey}>
                        {sData.name} ({sKey})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>2. Página (Nivel 2 Pantalla) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej: bookings, orders, catalog..."
                    required
                    value={createPage}
                    onChange={(e) => setCreatePage(e.target.value)}
                  />
                </div>
              </div>

              {/* Nivel 3 */}
              <div className="catalog-modal-grid">
                <div className="form-group">
                  <label>3. Key del Módulo / Feature (Nivel 3) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej: waitlist, photo_upload..."
                    required
                    value={createModuleKey}
                    onChange={(e) => setCreateModuleKey(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo (Kind) *</label>
                  <select
                    className="form-select"
                    value={createKind}
                    onChange={(e) => setCreateKind(e.target.value as ModuleCatalogKind)}
                  >
                    <option value="feature">Feature / Función (Capability)</option>
                    <option value="module">Módulo (Núcleo funcional)</option>
                    <option value="page">Página (Pantalla navegable)</option>
                  </select>
                </div>
              </div>

              <div className="catalog-modal-grid">
                <div className="form-group">
                  <label>Scope de Ejecución</label>
                  <select
                    className="form-select"
                    value={createScope}
                    onChange={(e) => setCreateScope(e.target.value as 'tenant' | 'platform' | 'public')}
                  >
                    <option value="tenant">Tenant (Comercio)</option>
                    <option value="platform">Platform (Global Aurea)</option>
                    <option value="public">Public (Web pública)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Equipo Responsable</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej: services-team"
                    value={createOwnerTeam}
                    onChange={(e) => setCreateOwnerTeam(e.target.value)}
                  />
                </div>
              </div>

              {/* Vista previa del namespace */}
              <div className="lifecycle-alert" style={{ background: 'var(--color-surface-subtle)' }}>
                <strong>Namespace Canónico Resultante:</strong>
                <br />
                <code style={{ fontSize: '0.9rem', color: 'var(--color-brand)' }}>{calculatedNamespace}</code>
                <br />
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>
                  Ubicación física: <code>src/tenant/sections/{createSection}/{createPage}/</code>
                </span>
              </div>

              <div className="form-group">
                <label>Nombre Descriptivo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej: Lista de Espera Inteligente"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe el propósito de la función y cuándo se habilita..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>

              <div className="catalog-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" id="btn-submit-create-module">
                  Registrar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
