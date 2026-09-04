import { useState, useEffect, useMemo, useId } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../stores/authStore';
import { plansService } from '../services/plans.service';
import { INITIAL_CANONICAL_PLANS } from '../config/canonicalPlans';
import { CANONICAL_SECTIONS, INITIAL_CANONICAL_ENTRIES } from '../config/canonicalCatalog';
import type {
  PlatformPlan,
  PlanStatus,
  PlanBillingInterval,
  PlanPrice,
  CreatePlanDto,
  UpdatePlanDto,
} from '../types/plans';

// Tooltip explicativo accesible para formularios y vistas de detalle (discreto y elegante)
function HelpTooltip({ text, align = 'left' }: { text: string; align?: 'left' | 'right' }) {
  return (
    <span
      className={`help-tooltip-trigger ${align === 'right' ? 'help-tooltip-trigger--right' : ''}`}
      tabIndex={0}
      role="tooltip"
      aria-label={text}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span className="help-tooltip-bubble">{text}</span>
    </span>
  );
}

export function PlansPage() {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'platform_owner';
  const canWrite = isOwner || (user?.allowedFeatures ?? []).includes('platform.plans.write');

  // Directory state
  const [plans, setPlans] = useState<PlatformPlan[]>(INITIAL_CANONICAL_PLANS);

  // Search and status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PlanStatus>('all');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const [modalActiveTab, setModalActiveTab] = useState<'general' | 'pricing' | 'credits' | 'features'>('general');
  const [detailActiveTab, setDetailActiveTab] = useState<'summary' | 'pricing' | 'credits' | 'features'>('summary');

  const [targetPlan, setTargetPlan] = useState<PlatformPlan | null>(null);
  const [detailPlan, setDetailPlan] = useState<PlatformPlan | null>(null);

  // Form state for Create / Edit
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<PlanStatus>('active');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsCustom, setFormIsCustom] = useState(false);
  const [formTrialDays, setFormTrialDays] = useState(14);
  const [formGracePeriodDays, setFormGracePeriodDays] = useState(14);

  const [formPrices, setFormPrices] = useState<PlanPrice[]>([
    { currency: 'ARS', amount: 39900, interval: 'monthly', isActive: true },
    { currency: 'ARS', amount: 109000, interval: 'quarterly', isActive: true },
    { currency: 'ARS', amount: 399000, interval: 'yearly', isActive: true },
  ]);

  const [formDiscountEnabled, setFormDiscountEnabled] = useState(false);
  const [formDiscountPercentage, setFormDiscountPercentage] = useState(20);
  const [formDiscountDurationMonths, setFormDiscountDurationMonths] = useState(12);

  const [formCreditsMonthly, setFormCreditsMonthly] = useState(25000);
  const [formCreditsRollover, setFormCreditsRollover] = useState(false);

  const [formLimitUsers, setFormLimitUsers] = useState(5);
  const [formLimitBranches, setFormLimitBranches] = useState(1);
  const [formLimitStorageGb, setFormLimitStorageGb] = useState(10);
  const [formLimitApiRate, setFormLimitApiRate] = useState(120);

  const [formIncludedFeatures, setFormIncludedFeatures] = useState<string[]>([
    'services.bookings',
    'commerce.catalog',
  ]);

  // Unique accessible IDs for form fields
  const createPlanKeyId = useId();
  const createPlanNameId = useId();
  const createPlanStatusId = useId();
  const createPlanOrderId = useId();
  const createPlanTrialId = useId();
  const createPlanGraceId = useId();
  const createPlanDescId = useId();
  const createPlanCreditsId = useId();
  const createPlanUsersId = useId();
  const createPlanBranchesId = useId();
  const createPlanStorageId = useId();
  const createPlanApiRateId = useId();

  // Lock body scroll when modals are open
  useEffect(() => {
    const hasOpenModal =
      isCreateModalOpen ||
      isDetailModalOpen ||
      isStatusModalOpen ||
      isArchiveModalOpen;

    if (hasOpenModal) {
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
  }, [isCreateModalOpen, isDetailModalOpen, isStatusModalOpen, isArchiveModalOpen]);

  // Close modals on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsDetailModalOpen(false);
        setIsEditingInDetail(false);
        setIsStatusModalOpen(false);
        setIsArchiveModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch plans on mount
  useEffect(() => {
    let isMounted = true;
    const loadPlans = async () => {
      setIsLoading(true);
      try {
        const response = await plansService.findAll();
        const loadedPlans = Array.isArray(response) ? response : response.data;
        if (isMounted && Array.isArray(loadedPlans) && loadedPlans.length > 0) {
          setPlans(loadedPlans);
        }
      } catch (err) {
        console.warn('Backend unavailable, using initial canonical plans', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to extract all available canonical features
  const allAvailableFeatures = useMemo(() => {
    return INITIAL_CANONICAL_ENTRIES.map((entry) => {
      const secName = CANONICAL_SECTIONS[entry.sectionKey]?.name ?? entry.sectionKey;
      return {
        key: entry.key,
        name: `${secName} → ${entry.name}`,
        sectionName: secName,
      };
    });
  }, []);

  // Counts by status
  const statusCounts = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.status === 'active').length;
    const draft = plans.filter((p) => p.status === 'draft').length;
    const archived = plans.filter((p) => p.status === 'archived').length;
    return { total, active, draft, archived };
  }, [plans]);

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter !== 'all' && plan.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = plan.name.toLowerCase().includes(q);
        const matchKey = plan.key.toLowerCase().includes(q);
        const matchDesc = plan.description?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [plans, statusFilter, searchQuery]);

  // Open Create Modal
  // Helper to extract unique bimonetary prices (monthly, quarterly, yearly)
  const extractBimonetaryFormPrices = (planPrices?: PlanPrice[]): PlanPrice[] => {
    if (!planPrices || planPrices.length === 0) {
      return [
        { currency: 'ARS', amount: 39900, interval: 'monthly', isActive: true },
        { currency: 'ARS', amount: 109000, interval: 'quarterly', isActive: true },
        { currency: 'ARS', amount: 399000, interval: 'yearly', isActive: true },
      ];
    }
    const result: PlanPrice[] = [];
    const intervals: PlanBillingInterval[] = ['monthly', 'quarterly', 'yearly'];
    intervals.forEach((interval) => {
      const match = planPrices.filter((p) => p.interval === interval);
      if (match.length > 0) {
        const ars = match.find((p) => p.currency === 'ARS');
        const usd = match.find((p) => p.currency === 'USD');
        const amount = ars ? ars.amount : usd ? usd.amount * 1000 : match[0].amount;
        result.push({
          currency: 'ARS',
          amount,
          interval,
          isActive: match.some((p) => p.isActive !== false),
        });
      }
    });
    if (result.length === 0) {
      result.push({ currency: 'ARS', amount: 39900, interval: 'monthly', isActive: true });
    }
    return result;
  };

  // Helper to generate full bimonetary prices payload (both ARS and auto-calculated USD)
  const buildBimonetaryPricesPayload = (pricesList: PlanPrice[]): PlanPrice[] => {
    return pricesList.flatMap((p) => {
      const arsAmount = Number(p.amount) || 0;
      const usdAmount = Math.round(arsAmount / 1000);
      return [
        {
          currency: 'ARS',
          amount: arsAmount,
          interval: p.interval,
          isActive: p.isActive !== false,
        },
        {
          currency: 'USD',
          amount: usdAmount,
          interval: p.interval,
          isActive: p.isActive !== false,
        },
      ];
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormKey('');
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setFormDisplayOrder(plans.length + 1);
    setFormIsPopular(false);
    setFormIsCustom(false);
    setFormTrialDays(14);
    setFormGracePeriodDays(14);
    setFormPrices([
      { currency: 'ARS', amount: 39900, interval: 'monthly', isActive: true },
      { currency: 'ARS', amount: 109000, interval: 'quarterly', isActive: true },
      { currency: 'ARS', amount: 399000, interval: 'yearly', isActive: true },
    ]);
    setFormDiscountEnabled(false);
    setFormDiscountPercentage(20);
    setFormDiscountDurationMonths(12);
    setFormCreditsMonthly(25000);
    setFormCreditsRollover(false);
    setFormLimitUsers(5);
    setFormLimitBranches(1);
    setFormLimitStorageGb(10);
    setFormLimitApiRate(120);
    setFormIncludedFeatures(['services.bookings', 'commerce.catalog']);
    setModalActiveTab('general');
    setIsCreateModalOpen(true);
  };

  // Helper to load plan into form state
  const loadPlanToForm = (plan: PlatformPlan) => {
    setFormKey(plan.key);
    setFormName(plan.name);
    setFormDescription(plan.description ?? '');
    setFormStatus(plan.status);
    setFormDisplayOrder(plan.displayOrder ?? 1);
    setFormIsPopular(Boolean(plan.isPopular));
    setFormIsCustom(Boolean(plan.isCustom || plan.key === 'custom'));
    setFormTrialDays(plan.trialDays ?? 14);
    setFormGracePeriodDays(plan.gracePeriodDays ?? 14);
    setFormPrices(extractBimonetaryFormPrices(plan.prices));
    const discountData = plan.discount ?? (plan.limits as Record<string, any> | undefined)?.discount;
    setFormDiscountEnabled(Boolean(discountData?.enabled));
    setFormDiscountPercentage(discountData?.percentage ?? 20);
    setFormDiscountDurationMonths(discountData?.durationMonths ?? 12);
    setFormCreditsMonthly(plan.credits?.monthly ?? 0);
    setFormCreditsRollover(Boolean(plan.credits?.rollover));
    setFormLimitUsers(Number(plan.limits?.maxUsers ?? 5));
    setFormLimitBranches(Number(plan.limits?.maxBranches ?? 1));
    setFormLimitStorageGb(Number(plan.limits?.storageGb ?? 10));
    setFormLimitApiRate(Number(plan.limits?.apiRateLimit ?? 120));
    setFormIncludedFeatures([...(plan.includedFeatures ?? [])]);
  };

  // Open Detail Modal
  const handleOpenDetailModal = (plan: PlatformPlan) => {
    setDetailPlan(plan);
    setTargetPlan(plan);
    loadPlanToForm(plan);
    setIsEditingInDetail(false);
    setDetailActiveTab('summary');
    setIsDetailModalOpen(true);
  };

  // Open Status Modal
  const handleOpenStatusModal = (plan: PlatformPlan) => {
    setTargetPlan(plan);
    setFormStatus(plan.status);
    setIsStatusModalOpen(true);
  };

  // Open Archive Modal
  const handleOpenArchiveModal = (plan: PlatformPlan) => {
    setTargetPlan(plan);
    setIsArchiveModalOpen(true);
  };

  // Price points builder helpers (Máximo 1 mensual, 1 trimestral y 1 anual)
  const handleAddPrice = () => {
    const hasMonthly = formPrices.some((p) => p.interval === 'monthly');
    const hasQuarterly = formPrices.some((p) => p.interval === 'quarterly');
    const hasYearly = formPrices.some((p) => p.interval === 'yearly');
    if (hasMonthly && hasQuarterly && hasYearly) {
      showToast('Solo se permite 1 periodicidad mensual, 1 trimestral y 1 anual por plan');
      return;
    }
    let nextInterval: PlanBillingInterval = 'monthly';
    let defaultAmount = 39900;
    if (!hasMonthly) {
      nextInterval = 'monthly';
      defaultAmount = 39900;
    } else if (!hasQuarterly) {
      nextInterval = 'quarterly';
      defaultAmount = 109000;
    } else {
      nextInterval = 'yearly';
      defaultAmount = 399000;
    }
    setFormPrices((prev) => [
      ...prev,
      { currency: 'ARS', amount: defaultAmount, interval: nextInterval, isActive: true },
    ]);
  };

  const handleRemovePrice = (index: number) => {
    setFormPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePriceChange = (index: number, field: keyof PlanPrice, value: unknown) => {
    if (field === 'interval') {
      const isAlreadyUsed = formPrices.some((p, i) => i !== index && p.interval === value);
      if (isAlreadyUsed) {
        const intervalName = value === 'monthly' ? 'mensual' : value === 'quarterly' ? 'trimestral' : 'anual';
        showToast(`Ya existe un precio asignado para la periodicidad ${intervalName}`);
        return;
      }
    }
    setFormPrices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Toggle feature inclusion
  const handleToggleFeature = (featureKey: string) => {
    setFormIncludedFeatures((prev) => {
      if (prev.includes(featureKey)) {
        return prev.filter((k) => k !== featureKey);
      } else {
        return [...prev, featureKey];
      }
    });
  };

  // Submit Create Plan
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKey.trim() || !formName.trim()) {
      showToast('Por favor completa la clave única y el nombre del plan');
      return;
    }

    const discountPayload = formDiscountEnabled
      ? {
          enabled: true,
          percentage: Number(formDiscountPercentage) || 0,
          durationMonths: Number(formDiscountDurationMonths) || 12,
        }
      : {
          enabled: false,
          percentage: 0,
          durationMonths: 0,
        };

    const payload: CreatePlanDto = {
      key: formKey.trim().toLowerCase(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      displayOrder: Number(formDisplayOrder),
      isPopular: formIsPopular,
      isCustom: formIsCustom,
      trialDays: Number(formTrialDays),
      gracePeriodDays: Number(formGracePeriodDays),
      prices: formIsCustom && formPrices.length === 0 ? [] : buildBimonetaryPricesPayload(formPrices),
      discount: discountPayload,
      credits: {
        monthly: Number(formCreditsMonthly),
        rollover: formCreditsRollover,
      },
      limits: {
        maxUsers: Number(formLimitUsers),
        maxBranches: Number(formLimitBranches),
        storageGb: Number(formLimitStorageGb),
        apiRateLimit: Number(formLimitApiRate),
        discount: discountPayload,
      },
      includedFeatures: formIncludedFeatures,
    };

    setIsSaving(true);
    try {
      // Stripping non-whitelisted root keys so NestJS forbidNonWhitelisted doesn't throw 400
      const { isCustom: _c, discount: _d, ...backendPayload } = payload;
      const created = await plansService.create(backendPayload as CreatePlanDto);
      setPlans((prev) => [...prev, created]);
      setIsCreateModalOpen(false);
      showToast(`Plan "${payload.name}" creado con éxito`);
    } catch (err: unknown) {
      console.warn('API error creating plan, saving locally', err);
      const fallbackPlan: PlatformPlan = {
        ...payload,
        id: `plan-${Date.now()}`,
        status: payload.status ?? 'active',
        displayOrder: payload.displayOrder ?? 1,
        includedFeatures: payload.includedFeatures ?? [],
        prices: payload.prices ?? [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlans((prev) => [...prev, fallbackPlan]);
      setIsCreateModalOpen(false);
      showToast(`Plan "${payload.name}" creado con éxito (local)`);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Edit Plan from inside Detail Modal
  const handleSaveDetailEdit = async () => {
    if (!detailPlan) return;

    const discountPayload = formDiscountEnabled
      ? {
          enabled: true,
          percentage: Number(formDiscountPercentage) || 0,
          durationMonths: Number(formDiscountDurationMonths) || 12,
        }
      : {
          enabled: false,
          percentage: 0,
          durationMonths: 0,
        };

    const payload: UpdatePlanDto = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      displayOrder: Number(formDisplayOrder),
      isPopular: formIsPopular,
      isCustom: formIsCustom,
      trialDays: Number(formTrialDays),
      gracePeriodDays: Number(formGracePeriodDays),
      prices: formIsCustom && formPrices.length === 0 ? [] : buildBimonetaryPricesPayload(formPrices),
      discount: discountPayload,
      credits: {
        monthly: Number(formCreditsMonthly),
        rollover: formCreditsRollover,
      },
      limits: {
        maxUsers: Number(formLimitUsers),
        maxBranches: Number(formLimitBranches),
        storageGb: Number(formLimitStorageGb),
        apiRateLimit: Number(formLimitApiRate),
        discount: discountPayload,
      },
      includedFeatures: formIncludedFeatures,
    };

    setIsSaving(true);
    try {
      const { isCustom: _c, discount: _d, ...backendPayload } = payload;
      const updated = await plansService.update(detailPlan.id || detailPlan.key, backendPayload as UpdatePlanDto);
      setPlans((prev) =>
        prev.map((p) => (p.id === detailPlan.id || p.key === detailPlan.key ? { ...p, ...updated } : p))
      );
      setDetailPlan((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditingInDetail(false);
      showToast(`Plan "${payload.name}" actualizado con éxito`);
    } catch (err: unknown) {
      console.warn('API error updating plan, updating locally', err);
      const updatedLocal: Partial<PlatformPlan> = {
        ...payload,
        version: (detailPlan.version ?? 1) + 1,
        updatedAt: new Date().toISOString(),
      };
      setPlans((prev) =>
        prev.map((p) =>
          p.id === detailPlan.id || p.key === detailPlan.key
            ? { ...p, ...updatedLocal }
            : p
        )
      );
      setDetailPlan((prev) => (prev ? { ...prev, ...updatedLocal } : prev));
      setIsEditingInDetail(false);
      showToast(`Plan "${payload.name}" actualizado con éxito (local)`);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Status Change
  const handleSubmitStatus = async () => {
    if (!targetPlan) return;
    setIsSaving(true);
    try {
      await plansService.updateStatus(targetPlan.id || targetPlan.key, { status: formStatus });
      setPlans((prev) =>
        prev.map((p) => (p.id === targetPlan.id || p.key === targetPlan.key ? { ...p, status: formStatus } : p))
      );
      if (detailPlan && (detailPlan.id === targetPlan.id || detailPlan.key === targetPlan.key)) {
        setDetailPlan((prev) => (prev ? { ...prev, status: formStatus } : prev));
      }
      setIsStatusModalOpen(false);
      showToast(`Estado de "${targetPlan.name}" actualizado a ${formStatus}`);
    } catch (err: unknown) {
      console.warn('API error changing status, applying locally', err);
      setPlans((prev) =>
        prev.map((p) => (p.id === targetPlan.id || p.key === targetPlan.key ? { ...p, status: formStatus } : p))
      );
      if (detailPlan && (detailPlan.id === targetPlan.id || detailPlan.key === targetPlan.key)) {
        setDetailPlan((prev) => (prev ? { ...prev, status: formStatus } : prev));
      }
      setIsStatusModalOpen(false);
      showToast(`Estado de "${targetPlan.name}" actualizado a ${formStatus} (local)`);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Archive Plan
  const handleSubmitArchive = async () => {
    if (!targetPlan) return;
    setIsSaving(true);
    try {
      await plansService.archive(targetPlan.id || targetPlan.key);
      setPlans((prev) =>
        prev.map((p) => (p.id === targetPlan.id || p.key === targetPlan.key ? { ...p, status: 'archived' } : p))
      );
      if (detailPlan && (detailPlan.id === targetPlan.id || detailPlan.key === targetPlan.key)) {
        setDetailPlan((prev) => (prev ? { ...prev, status: 'archived' } : prev));
      }
      setIsArchiveModalOpen(false);
      showToast(`Plan "${targetPlan.name}" archivado`);
    } catch (err: unknown) {
      console.warn('API error archiving plan, applying locally', err);
      setPlans((prev) =>
        prev.map((p) => (p.id === targetPlan.id || p.key === targetPlan.key ? { ...p, status: 'archived' } : p))
      );
      if (detailPlan && (detailPlan.id === targetPlan.id || detailPlan.key === targetPlan.key)) {
        setDetailPlan((prev) => (prev ? { ...prev, status: 'archived' } : prev));
      }
      setIsArchiveModalOpen(false);
      showToast(`Plan "${targetPlan.name}" archivado (local)`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      {/* Feedback Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            border: '1px solid var(--color-brand)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 600,
            animation: 'fadeInDown 0.2s ease-out',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="page-header">
        <div className="page-header__content">
          <h1>Planes Comerciales y Precios</h1>
          <p>
            Gestión integral de membresías, precios multimoneda, créditos y módulos por plan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!canWrite ? (
            <div className="readonly-indicator">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Solo lectura</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-primary"
              title="Crear nuevo plan comercial"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Crear nuevo plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Control y Filtros (Sin combo de monedas innecesario) */}
      <div className="plans-controls-bar">
        {/* Status segmented pills */}
        <div className="plans-status-tabs">
          <button
            type="button"
            className={`plans-status-tab ${statusFilter === 'all' ? 'plans-status-tab--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>Todos</span>
            <span className="plans-status-tab__count">{statusCounts.total}</span>
          </button>
          <button
            type="button"
            className={`plans-status-tab ${statusFilter === 'active' ? 'plans-status-tab--active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span>Activos</span>
            <span className="plans-status-tab__count">{statusCounts.active}</span>
          </button>
          <button
            type="button"
            className={`plans-status-tab ${statusFilter === 'draft' ? 'plans-status-tab--active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            <span>Borradores</span>
            <span className="plans-status-tab__count">{statusCounts.draft}</span>
          </button>
          <button
            type="button"
            className={`plans-status-tab ${statusFilter === 'archived' ? 'plans-status-tab--active' : ''}`}
            onClick={() => setStatusFilter('archived')}
          >
            <span>Archivados</span>
            <span className="plans-status-tab__count">{statusCounts.archived}</span>
          </button>
        </div>

        {/* Search box limpia a la derecha */}
        <div className="plans-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-soft)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, slug o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-soft)', cursor: 'pointer', padding: 0 }}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid de Planes */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-soft)' }}>
          Cargando catálogo de planes comerciales...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginTop: 20,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-soft)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>
            No se encontraron planes con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="btn-secondary"
            style={{ marginTop: 12, fontSize: '0.82rem' }}
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="plans-directory-grid">
          {filteredPlans.map((plan) => {
            const isCustomPlan = Boolean(plan.isCustom || plan.key === 'custom');
            const activePrices = plan.prices?.filter((p) => p.isActive !== false) ?? [];
            const monthlyArsObj = activePrices.find((p) => p.interval === 'monthly' && p.currency === 'ARS');
            const monthlyUsdObj = activePrices.find((p) => p.interval === 'monthly' && p.currency === 'USD');
            const monthlyArs = monthlyArsObj ? monthlyArsObj.amount : (monthlyUsdObj ? monthlyUsdObj.amount * 1000 : (activePrices.find((p) => p.interval === 'monthly')?.amount ?? null));
            const monthlyUsd = monthlyUsdObj ? monthlyUsdObj.amount : (monthlyArs !== null ? Math.round(monthlyArs / 1000) : null);

            const quarterlyArsObj = activePrices.find((p) => p.interval === 'quarterly' && p.currency === 'ARS');
            const quarterlyUsdObj = activePrices.find((p) => p.interval === 'quarterly' && p.currency === 'USD');
            const quarterlyArs = quarterlyArsObj ? quarterlyArsObj.amount : (quarterlyUsdObj ? quarterlyUsdObj.amount * 1000 : (activePrices.find((p) => p.interval === 'quarterly')?.amount ?? null));
            const quarterlyUsd = quarterlyUsdObj ? quarterlyUsdObj.amount : (quarterlyArs !== null ? Math.round(quarterlyArs / 1000) : null);

            const yearlyArsObj = activePrices.find((p) => p.interval === 'yearly' && p.currency === 'ARS');
            const yearlyUsdObj = activePrices.find((p) => p.interval === 'yearly' && p.currency === 'USD');
            const yearlyArs = yearlyArsObj ? yearlyArsObj.amount : (yearlyUsdObj ? yearlyUsdObj.amount * 1000 : (activePrices.find((p) => p.interval === 'yearly')?.amount ?? null));
            const yearlyUsd = yearlyUsdObj ? yearlyUsdObj.amount : (yearlyArs !== null ? Math.round(yearlyArs / 1000) : null);

            return (
              <div key={plan.id || plan.key} className="plan-overview-card">
                {/* Header: Top-bar (Key + Badges) + Dedicated Title Row */}
                <div className="plan-overview-card__header">
                  <div className="plan-overview-card__top-bar">
                    <span className="plan-overview-card__key">{plan.key}</span>
                    <div className="plan-overview-card__badges">
                      {isCustomPlan && (
                        <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
                          Personalizado
                        </span>
                      )}
                      {(() => {
                        const discount = plan.discount ?? (plan.limits as Record<string, any> | undefined)?.discount;
                        if (!discount?.enabled) return null;
                        return (
                          <span className="discount-card-badge">
                            🏷️ {discount.percentage}% OFF {discount.durationMonths === 0 ? 'Permanente' : `(${discount.durationMonths}m)`}
                          </span>
                        );
                      })()}
                      {plan.isPopular && <span className="popular-badge">★ Popular</span>}
                      <span className={`status-badge status-badge--${plan.status}`}>
                        {plan.status === 'active' ? 'Activo' : plan.status === 'draft' ? 'Borrador' : 'Archivado'}
                      </span>
                    </div>
                  </div>
                  <h3 className="plan-overview-card__title">{plan.name}</h3>
                </div>

                {/* Description */}
                <p className="plan-overview-card__description">
                  {plan.description || 'Sin descripción comercial especificada.'}
                </p>

                {/* Pricing Box destacado */}
                <div className="plan-overview-card__pricing-box">
                  {isCustomPlan && activePrices.length === 0 ? (
                    <div className="plan-price-primary" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="plan-price-amount" style={{ fontSize: '1.25rem', color: 'var(--color-brand)' }}>
                        A convenir
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        Cotización y condiciones personalizadas
                      </span>
                    </div>
                  ) : monthlyArs !== null ? (
                    <>
                      <div className="plan-price-primary">
                        <span className="plan-price-amount">
                          ARS ${monthlyArs.toLocaleString()}
                        </span>
                        <span className="plan-price-interval">/mes</span>
                        {monthlyUsd !== null && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-brand)', fontWeight: 600, marginLeft: 6 }}>
                            (≈ USD ${monthlyUsd})
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                        {quarterlyArs !== null && (
                          <div className="plan-price-secondary">
                            <span>Trimestral: ARS ${quarterlyArs.toLocaleString()}/trimestre {quarterlyUsd !== null ? `(≈ USD $${quarterlyUsd})` : ''}</span>
                          </div>
                        )}
                        {yearlyArs !== null && (
                          <div className="plan-price-secondary">
                            <span>Anual: ARS ${yearlyArs.toLocaleString()}/año {yearlyUsd !== null ? `(≈ USD $${yearlyUsd})` : ''}</span>
                            {(() => {
                              const discount = plan.discount ?? (plan.limits as Record<string, any> | undefined)?.discount;
                              if (!discount?.enabled) return null;
                              return (
                                <span style={{ color: '#10b981', fontWeight: 600, marginLeft: 5 }}>
                                  • {discount.percentage}% OFF {discount.durationMonths === 0 ? 'permanente' : `por ${discount.durationMonths} meses`}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </>
                  ) : activePrices.length > 0 ? (
                    <div className="plan-price-primary">
                      <span className="plan-price-amount">
                        {activePrices[0].currency} ${activePrices[0].amount.toLocaleString()}
                      </span>
                      <span className="plan-price-interval">
                        /{activePrices[0].interval === 'monthly' ? 'mes' : activePrices[0].interval === 'quarterly' ? 'trimestre' : 'año'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)' }}>
                      Personalizado / Cotización a medida
                    </span>
                  )}
                </div>

                {/* Chips de Features y Créditos */}
                <div className="plan-meta-chips">
                  <span className="meta-chip meta-chip--highlight">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {plan.includedFeatures?.length ?? 0} features
                  </span>
                  <span className="meta-chip">
                    {(plan.credits?.monthly ?? 0).toLocaleString()} créditos/mes
                  </span>
                  {plan.trialDays ? (
                    <span className="meta-chip">{plan.trialDays}d trial</span>
                  ) : null}
                </div>

                {/* Footer con ÚNICO botón de Ver Detalle (sin botones pequeños en la card) */}
                <div className="plan-overview-card__footer">
                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(plan)}
                    className="btn-secondary plan-overview-card__btn-detail"
                  >
                    <span>Ver detalle</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE Y EDICIÓN INTEGRADA DEL PLAN (TAMAÑO FIJO Y RESPONSIVE) */}
      {/* ========================================================================= */}
      {isDetailModalOpen && detailPlan && (
        <div className="catalog-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="plan-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="module-config-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text)' }}>
                    {isEditingInDetail ? `Editar: ${formName || detailPlan.name}` : detailPlan.name}
                  </h2>
                  <span className={`status-badge status-badge--${detailPlan.status}`}>
                    {detailPlan.status === 'active' ? 'Activo' : detailPlan.status === 'draft' ? 'Borrador' : 'Archivado'}
                  </span>
                  {detailPlan.isPopular && <span className="popular-badge">★ Popular</span>}
                  <span className="plan-overview-card__key">{detailPlan.key}</span>
                  {isEditingInDetail && (
                    <span className="meta-chip meta-chip--highlight" style={{ fontSize: '0.7rem' }}>
                      Modo edición
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Versión {detailPlan.version ?? 1} • {detailPlan.description || 'Sin descripción comercial.'}
                </p>
              </div>

              {/* Botón de cerrar modal en Header (limpio y estándar de escritorio) */}
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsEditingInDetail(false);
                }}
                className="action-dots-btn"
                title="Cerrar ventana"
                aria-label="Cerrar ventana"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs (Solapas visibles y sin números) */}
            <div className="plan-modal-tabs">
              <button
                type="button"
                onClick={() => setDetailActiveTab('summary')}
                className={`plan-modal-tab-btn ${detailActiveTab === 'summary' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('pricing')}
                className={`plan-modal-tab-btn ${detailActiveTab === 'pricing' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Precios & Facturación</span>
                <span className="plans-status-tab__count">{isEditingInDetail ? formPrices.length : (detailPlan.prices?.length ?? 0)}</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('credits')}
                className={`plan-modal-tab-btn ${detailActiveTab === 'credits' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Créditos & Límites</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('features')}
                className={`plan-modal-tab-btn ${detailActiveTab === 'features' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Features</span>
                <span className="plans-status-tab__count">{isEditingInDetail ? formIncludedFeatures.length : (detailPlan.includedFeatures?.length ?? 0)}</span>
              </button>
            </div>

            {/* Modal Content (Altura fija con scroll interno) */}
            <div className="plan-modal-body">
              {/* TAB 1: GENERAL */}
              {detailActiveTab === 'summary' && (
                !isEditingInDetail ? (
                  <div className="plan-summary-grid">
                    <div className="plan-summary-card">
                      <h4 className="plan-summary-section-title">Identificación y Estado</h4>
                      <div className="plan-summary-row">
                        <span>Nombre comercial</span>
                        <strong>{detailPlan.name}</strong>
                      </div>
                      <div className="plan-summary-row">
                        <span>Clave única (slug)</span>
                        <span style={{ fontFamily: 'monospace' }}>{detailPlan.key}</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>Tipo de plan</span>
                        <span>{detailPlan.isCustom || detailPlan.key === 'custom' ? 'Plan Personalizado (A convenir)' : 'Plan Estándar'}</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>Estado del plan</span>
                        <span className={`status-badge status-badge--${detailPlan.status}`}>{detailPlan.status}</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>Destacado</span>
                        <span>{detailPlan.isPopular ? 'Sí (Plan popular)' : 'No'}</span>
                      </div>
                    </div>

                    <div className="plan-summary-card">
                      <h4 className="plan-summary-section-title">Políticas y Operatoria</h4>
                      <div className="plan-summary-row">
                        <span>
                          Días de prueba (Trial)
                          <HelpTooltip text="Días de uso bonificado sin costo al registrar una nueva cuenta antes de la primera factura." />
                        </span>
                        <span>{detailPlan.trialDays ?? 14} días</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>
                          Período de gracia (Grace)
                          <HelpTooltip text="Días de tolerancia tras un cobro fallido antes de suspender las funcionalidades del comercio." />
                        </span>
                        <span>{detailPlan.gracePeriodDays ?? 14} días</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>Orden de catálogo</span>
                        <span>Posición #{detailPlan.displayOrder ?? 1}</span>
                      </div>
                      <div className="plan-summary-row">
                        <span>Descripción</span>
                        <span style={{ textAlign: 'right', maxWidth: 280, fontSize: '0.8rem' }}>{detailPlan.description || 'Sin descripción'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label>Clave única (slug)</label>
                        <input type="text" value={formKey} disabled className="form-input" />
                      </div>
                      <div className="form-group">
                        <label>Nombre comercial *</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label>Orden de catálogo</label>
                        <input
                          type="number"
                          min="0"
                          value={formDisplayOrder}
                          onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Días de prueba (Trial)
                          <HelpTooltip text="Días de uso bonificado sin costo al registrarse antes de la primera factura." />
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formTrialDays}
                          onChange={(e) => setFormTrialDays(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Período de gracia (días)
                        <HelpTooltip text="Días de tolerancia tras un cobro fallido antes de suspender el servicio." />
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formGracePeriodDays}
                        onChange={(e) => setFormGracePeriodDays(Number(e.target.value))}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Descripción del plan</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          id="edit-detail-is-custom"
                          checked={formIsCustom}
                          onChange={(e) => setFormIsCustom(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                        />
                        <label htmlFor="edit-detail-is-custom" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                          Plan Personalizado (Precio a convenir / Cotización a medida)
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          id="edit-detail-is-popular"
                          checked={formIsPopular}
                          onChange={(e) => setFormIsPopular(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                        />
                        <label htmlFor="edit-detail-is-popular" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                          Marcar como plan recomendado / popular
                        </label>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* TAB 2: PRECIOS & FACTURACIÓN */}
              {detailActiveTab === 'pricing' && (
                !isEditingInDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--color-brand)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        <strong>Planes bimonetarios:</strong> Se admiten periodicidades mensual, trimestral y anual. El valor equivalente en dólares (USD) se liquida de forma centralizada.
                      </span>
                    </div>

                    {/* Caso de Plan Personalizado sin tarifas fijas */}
                    {(detailPlan.isCustom || detailPlan.key === 'custom') && (!detailPlan.prices || detailPlan.prices.length === 0) ? (
                      <div style={{ padding: '24px 20px', textAlign: 'center', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>💼</div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--color-text)' }}>Plan Personalizado / Cotización a Medida</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                          Este plan comercial cuenta con condiciones y precios acordados a medida según el volumen, módulos requeridos y soporte contratado por el cliente.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Banner de Descuento Promocional Activo */}
                        {(() => {
                          const discount = detailPlan.discount ?? (detailPlan.limits as Record<string, any> | undefined)?.discount;
                          if (!discount?.enabled) return null;
                          return (
                            <div className="plan-discount-banner">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.86rem' }}>
                                    Descuento anual del {discount.percentage}% OFF configurado
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    Vigencia de la bonificación: {discount.durationMonths === 0 ? 'Permanente (durante toda la suscripción)' : `${discount.durationMonths} meses (primer año)`}.
                                  </div>
                                </div>
                              </div>
                              <span className="discount-pill-badge">
                                {discount.percentage}% OFF • {discount.durationMonths === 0 ? 'Permanente' : `${discount.durationMonths} meses`}
                              </span>
                            </div>
                          );
                        })()}

                        <div style={{ overflowX: 'auto' }}>
                          <table className="pricing-table">
                            <thead>
                              <tr>
                                <th>Periodicidad</th>
                                <th>Monto en Pesos (ARS)</th>
                                <th>Equivalente en Dólares (USD)</th>
                                <th>Descuento comercial</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Equivalencia mensual</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const prices = detailPlan.prices ?? [];
                                const discount = detailPlan.discount ?? (detailPlan.limits as Record<string, any> | undefined)?.discount;
                                const intervals: PlanBillingInterval[] = ['monthly', 'quarterly', 'yearly'];
                                const consolidatedTiers = intervals
                                  .map((interval) => {
                                    const match = prices.filter((p) => p.interval === interval);
                                    if (match.length === 0) return null;
                                    const ars = match.find((p) => p.currency === 'ARS');
                                    const usd = match.find((p) => p.currency === 'USD');
                                    const amountArs = ars ? ars.amount : (usd ? usd.amount * 1000 : match[0].amount);
                                    const amountUsd = usd ? usd.amount : Math.round(amountArs / 1000);
                                    const isActive = match.some((p) => p.isActive !== false);
                                    return { interval, amountArs, amountUsd, isActive };
                                  })
                                  .filter(Boolean);

                                if (consolidatedTiers.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-soft)' }}>
                                        No hay precios configurados para este plan.
                                      </td>
                                    </tr>
                                  );
                                }

                                return consolidatedTiers.map((tier, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      <strong>
                                        {tier!.interval === 'monthly' ? 'Mensual' : tier!.interval === 'quarterly' ? 'Trimestral' : 'Anual'}
                                      </strong>
                                    </td>
                                    <td>
                                      <strong style={{ color: 'var(--color-brand)' }}>
                                        ARS ${tier!.amountArs.toLocaleString()}
                                      </strong>
                                    </td>
                                    <td>
                                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                        USD ${tier!.amountUsd.toLocaleString()}
                                      </span>
                                    </td>
                                    <td>
                                      {tier!.interval === 'yearly' && discount?.enabled ? (
                                        <span className="discount-tag">
                                          🏷️ {discount.percentage}% OFF ({discount.durationMonths === 0 ? 'Permanente' : `${discount.durationMonths} meses`})
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-soft)', fontSize: '0.76rem' }}>
                                          Precio regular
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`status-badge status-badge--${tier!.isActive ? 'active' : 'draft'}`}>
                                        {tier!.isActive ? 'Habilitado' : 'Desactivado'}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right', color: 'var(--color-text-soft)', fontSize: '0.8rem' }}>
                                      {tier!.interval === 'yearly'
                                        ? `ARS $${Math.round(tier!.amountArs / 12).toLocaleString()}/mes (USD $${Math.round(tier!.amountUsd / 12)}/mes)${discount?.enabled ? ` • Ahorro del ${discount.percentage}%` : ''}`
                                        : tier!.interval === 'quarterly'
                                        ? `ARS $${Math.round(tier!.amountArs / 3).toLocaleString()}/mes (USD $${Math.round(tier!.amountUsd / 3)}/mes)`
                                        : `ARS $${tier!.amountArs.toLocaleString()}/mes (USD $${tier!.amountUsd}/mes)`}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--color-brand)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        <strong>Planes bimonetarios:</strong> Se admite como máximo 1 periodicidad mensual, 1 trimestral y 1 anual. Ingresa el monto en pesos (ARS) y el valor en dólares (USD) se calculará automáticamente.
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                        Puntos de facturación ({formPrices.length}/3):
                      </span>
                      {formPrices.length < 3 ? (
                        <button
                          type="button"
                          onClick={handleAddPrice}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          + Agregar Periodicidad
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>
                          Periodicidades mensual, trimestral y anual ya configuradas
                        </span>
                      )}
                    </div>

                    {/* Encabezados limpios sin tooltips redundantes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 190px 36px', gap: 12, padding: '0 14px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-soft)' }}>
                      <span>Periodicidad</span>
                      <span>Monto base (ARS)</span>
                      <span>Conversión USD</span>
                      <span />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {formPrices.map((price, idx) => (
                        <div key={idx} className="price-item-builder">
                          {/* Intervalo con deshabilitación de duplicados */}
                          <select
                            value={price.interval}
                            onChange={(e) => handlePriceChange(idx, 'interval', e.target.value as PlanBillingInterval)}
                            className="form-select"
                          >
                            <option
                              value="monthly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'monthly')}
                            >
                              Mensual
                            </option>
                            <option
                              value="quarterly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'quarterly')}
                            >
                              Trimestral
                            </option>
                            <option
                              value="yearly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'yearly')}
                            >
                              Anual
                            </option>
                          </select>

                          {/* Monto en ARS con prefijo visual */}
                          <div className="price-item-builder__ars-input">
                            <span className="price-item-builder__ars-prefix">ARS $</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={price.amount}
                              onChange={(e) => handlePriceChange(idx, 'amount', Number(e.target.value))}
                              className="form-input price-item-builder__input-field"
                              required
                            />
                          </div>

                          {/* Conversión USD automática calculada en tiempo real */}
                          <div className="price-item-builder__usd-calc">
                            <span>≈ USD ${Math.round((Number(price.amount) || 0) / 1000).toLocaleString()}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', fontWeight: 400 }}>
                              /{price.interval === 'monthly' ? 'mes' : price.interval === 'quarterly' ? 'trimestre' : 'año'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePrice(idx)}
                            className="action-dots-btn"
                            style={{ color: 'var(--color-danger)' }}
                            title="Eliminar esta periodicidad"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Configuración de Descuento Promocional / Anual */}
                    <div className="plan-discount-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={formDiscountEnabled}
                            onChange={(e) => setFormDiscountEnabled(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                          />
                          <span>Ofrecer descuento comercial / anual</span>
                        </label>
                        {formDiscountEnabled && (
                          <span className="discount-pill-badge">
                            🏷️ {formDiscountPercentage}% OFF • {formDiscountDurationMonths === 0 ? 'Permanente' : `${formDiscountDurationMonths} meses`}
                          </span>
                        )}
                      </div>

                      {formDiscountEnabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                          <div className="form-group">
                            <label>Porcentaje de descuento (%)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={formDiscountPercentage}
                                onChange={(e) => setFormDiscountPercentage(Number(e.target.value))}
                                className="form-input"
                                style={{ paddingRight: 32 }}
                                required
                              />
                              <span style={{ position: 'absolute', right: 12, fontWeight: 700, color: 'var(--color-text-soft)', pointerEvents: 'none' }}>%</span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Duración del descuento</label>
                            <select
                              value={formDiscountDurationMonths}
                              onChange={(e) => setFormDiscountDurationMonths(Number(e.target.value))}
                              className="form-select"
                            >
                              <option value={3}>Primeros 3 meses</option>
                              <option value={6}>Primeros 6 meses</option>
                              <option value={12}>Primer año (12 meses)</option>
                              <option value={24}>Primeros 2 años (24 meses)</option>
                              <option value={0}>Permanente (indefinido)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}


              {/* TAB 3: CRÉDITOS Y LÍMITES */}
              {detailActiveTab === 'credits' && (
                !isEditingInDetail ? (
                  <div className="plan-summary-grid">
                    <div className="plan-summary-card">
                      <h4 className="plan-summary-section-title">Créditos de Plataforma</h4>
                      <div className="credit-huge-number" style={{ fontSize: '2.4rem' }}>
                        {(detailPlan.credits?.monthly ?? 0).toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        Créditos incluidos al mes • {detailPlan.credits?.rollover ? 'Rollover acumulativo activo' : 'Sin rollover'}
                        <HelpTooltip text="Si está activo, los créditos no consumidos en el mes se acumulan para el período siguiente en lugar de vencer." />
                      </span>
                    </div>

                    <div className="plan-summary-card">
                      <h4 className="plan-summary-section-title">Límites de Recursos</h4>
                      <div className="plan-summary-row">
                        <span>Usuarios permitidos</span>
                        <strong>{detailPlan.limits?.maxUsers ?? 'Ilimitado'}</strong>
                      </div>
                      <div className="plan-summary-row">
                        <span>Sucursales / Locales</span>
                        <strong>{detailPlan.limits?.maxBranches ?? '1'}</strong>
                      </div>
                      <div className="plan-summary-row">
                        <span>Almacenamiento en nube</span>
                        <strong>{detailPlan.limits?.storageGb ? `${detailPlan.limits.storageGb} GB` : 'Estándar'}</strong>
                      </div>
                      <div className="plan-summary-row">
                        <span>
                          Tasa de solicitudes API
                          <HelpTooltip text="Límite máximo de peticiones por minuto permitidas hacia la API para prevenir abusos y sobrecargas." />
                        </span>
                        <span>{detailPlan.limits?.apiRateLimit ? `${detailPlan.limits.apiRateLimit} req/min` : 'Normal'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label>Créditos mensuales incluidos</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={formCreditsMonthly}
                          onChange={(e) => setFormCreditsMonthly(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={formCreditsRollover}
                            onChange={(e) => setFormCreditsRollover(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                          />
                          <span>Habilitar Rollover</span>
                          <HelpTooltip text="Si está activo, los créditos no consumidos en el mes se acumulan para el período siguiente en lugar de vencer." />
                        </label>
                      </div>
                    </div>

                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      Límites Operativos de Recursos
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label>Máximo de usuarios</label>
                        <input
                          type="number"
                          min="1"
                          value={formLimitUsers}
                          onChange={(e) => setFormLimitUsers(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Máximo de sucursales</label>
                        <input
                          type="number"
                          min="1"
                          value={formLimitBranches}
                          onChange={(e) => setFormLimitBranches(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label>Almacenamiento (GB)</label>
                        <input
                          type="number"
                          min="1"
                          value={formLimitStorageGb}
                          onChange={(e) => setFormLimitStorageGb(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          API Rate limit (req/min)
                          <HelpTooltip text="Límite de peticiones por minuto permitidas hacia la API para prevenir abusos y sobrecargas." />
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={formLimitApiRate}
                          onChange={(e) => setFormLimitApiRate(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* TAB 4: FEATURES */}
              {detailActiveTab === 'features' && (
                !isEditingInDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                      Módulos y características concedidas ({detailPlan.includedFeatures?.length ?? 0})
                    </div>
                    <div className="modules-check-grid">
                      {detailPlan.includedFeatures && detailPlan.includedFeatures.length > 0 ? (
                        detailPlan.includedFeatures.map((featKey) => (
                          <div key={featKey} className="module-check-pill">
                            <div className="module-check-row__left">
                              <div className="check-icon-circle">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{featKey}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', fontFamily: 'monospace' }}>
                              concedido
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', margin: 0 }}>
                          Sin features preconfiguradas en este plan.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                        Módulos y características permitidas
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setFormIncludedFeatures(allAvailableFeatures.map((f) => f.key))}
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIncludedFeatures([])}
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    <div className="plan-features-selection-grid">
                      {allAvailableFeatures.map((feat) => {
                        const isChecked = formIncludedFeatures.includes(feat.key);
                        return (
                          <label
                            key={feat.key}
                            className={`feature-checkbox-label ${isChecked ? 'feature-checkbox-label--checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleFeature(feat.key)}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{feat.name}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', fontFamily: 'monospace' }}>
                                {feat.key}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="module-config-modal-footer">
              {!isEditingInDetail ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {canWrite && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(detailPlan)}
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          title="Cambiar estado del plan"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>Cambiar Estado</span>
                        </button>

                        {detailPlan.status !== 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenArchiveModal(detailPlan)}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.82rem',
                              padding: '7px 12px',
                              color: 'var(--color-danger)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            title="Archivar este plan comercial"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="21 8 21 21 3 21 3 8" />
                              <rect x="1" y="3" width="22" height="5" />
                              <line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                            <span>Archivar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(detailPlan)}
                            className="btn-secondary"
                            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                          >
                            Desarchivar
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setIsEditingInDetail(false);
                      }}
                      className="btn-secondary"
                    >
                      Cerrar
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setIsEditingInDetail(true)}
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        title="Editar parámetros y configuración de este plan"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Editar Plan</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="meta-chip meta-chip--highlight" style={{ fontSize: '0.74rem' }}>
                      Modo edición activo
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        loadPlanToForm(detailPlan);
                        setIsEditingInDetail(false);
                      }}
                      className="btn-secondary"
                    >
                      Cancelar edición
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDetailEdit}
                      disabled={isSaving}
                      className="btn-primary"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR PLAN */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="catalog-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="plan-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="module-config-modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text)' }}>
                  Crear Nuevo Plan Comercial
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  Define claves, precios multimoneda, créditos incluidos y módulos permitidos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="action-dots-btn"
                title="Cerrar ventana"
                aria-label="Cerrar ventana"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs (Solapas visibles y sin números) */}
            <div className="plan-modal-tabs">
              <button
                type="button"
                onClick={() => setModalActiveTab('general')}
                className={`plan-modal-tab-btn ${modalActiveTab === 'general' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('pricing')}
                className={`plan-modal-tab-btn ${modalActiveTab === 'pricing' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Precios & Facturación</span>
                <span className="plans-status-tab__count">{formPrices.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('credits')}
                className={`plan-modal-tab-btn ${modalActiveTab === 'credits' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Créditos & Límites</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('features')}
                className={`plan-modal-tab-btn ${modalActiveTab === 'features' ? 'plan-modal-tab-btn--active' : ''}`}
              >
                <span>Features</span>
                <span className="plans-status-tab__count">{formIncludedFeatures.length}</span>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmitCreate}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              <div className="plan-modal-body">
                {/* TAB 1: GENERAL */}
                {modalActiveTab === 'general' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanKeyId}>
                          Clave única (slug) *
                        </label>
                        <input
                          id={createPlanKeyId}
                          type="text"
                          value={formKey}
                          onChange={(e) => setFormKey(e.target.value)}
                          placeholder="ej: standard, pro, enterprise"
                          required
                          className="form-input"
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)' }}>
                          Identificador canónico en minúsculas y sin espacios.
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor={createPlanNameId}>
                          Nombre comercial *
                        </label>
                        <input
                          id={createPlanNameId}
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="ej: Plan Profesional"
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanStatusId}>
                          Estado inicial
                        </label>
                        <select
                          id={createPlanStatusId}
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as PlanStatus)}
                          className="form-select"
                        >
                          <option value="active">Activo (Visible y contratable)</option>
                          <option value="draft">Borrador (Oculto)</option>
                          <option value="archived">Archivado</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={createPlanOrderId}>
                          Orden de catálogo
                        </label>
                        <input
                          id={createPlanOrderId}
                          type="number"
                          min="0"
                          value={formDisplayOrder}
                          onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanTrialId}>
                          Días de prueba gratuita (Trial)
                          <HelpTooltip text="Días de uso bonificado sin costo al registrarse antes de la primera factura." />
                        </label>
                        <input
                          id={createPlanTrialId}
                          type="number"
                          min="0"
                          value={formTrialDays}
                          onChange={(e) => setFormTrialDays(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={createPlanGraceId}>
                          Período de gracia (Grace period - días)
                          <HelpTooltip text="Días de tolerancia tras un cobro fallido antes de suspender el servicio." />
                        </label>
                        <input
                          id={createPlanGraceId}
                          type="number"
                          min="0"
                          value={formGracePeriodDays}
                          onChange={(e) => setFormGracePeriodDays(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor={createPlanDescId}>
                        Descripción del plan
                      </label>
                      <textarea
                        id={createPlanDescId}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Descripción comercial visible para los clientes y en el backoffice..."
                        rows={3}
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          id="plan-is-custom"
                          checked={formIsCustom}
                          onChange={(e) => setFormIsCustom(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                        />
                        <label htmlFor="plan-is-custom" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                          Plan Personalizado (Precio a convenir / Cotización a medida)
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          id="plan-is-popular"
                          checked={formIsPopular}
                          onChange={(e) => setFormIsPopular(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                        />
                        <label htmlFor="plan-is-popular" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                          Marcar como plan recomendado / popular (destacado visualmente)
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: PRECIOS Y FACTURACIÓN */}
                {modalActiveTab === 'pricing' && (
                  <>
                    <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--color-brand)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        <strong>Planes bimonetarios:</strong> Se admite como máximo 1 periodicidad mensual, 1 trimestral y 1 anual. Ingresa el monto en pesos (ARS) y el valor en dólares (USD) se calculará automáticamente.
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                        Puntos de facturación ({formPrices.length}/3):
                      </span>
                      {formPrices.length < 3 ? (
                        <button
                          type="button"
                          onClick={handleAddPrice}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          + Agregar Periodicidad
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>
                          Periodicidades mensual, trimestral y anual ya configuradas
                        </span>
                      )}
                    </div>

                    {/* Encabezados limpios sin tooltips */}
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 190px 36px', gap: 12, padding: '0 14px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-soft)' }}>
                      <span>Periodicidad</span>
                      <span>Monto base (ARS)</span>
                      <span>Conversión USD</span>
                      <span />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {formPrices.map((price, idx) => (
                        <div key={idx} className="price-item-builder">
                          {/* Intervalo con deshabilitación de duplicados */}
                          <select
                            value={price.interval}
                            onChange={(e) => handlePriceChange(idx, 'interval', e.target.value as PlanBillingInterval)}
                            className="form-select"
                          >
                            <option
                              value="monthly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'monthly')}
                            >
                              Mensual
                            </option>
                            <option
                              value="quarterly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'quarterly')}
                            >
                              Trimestral
                            </option>
                            <option
                              value="yearly"
                              disabled={formPrices.some((p, i) => i !== idx && p.interval === 'yearly')}
                            >
                              Anual
                            </option>
                          </select>

                          {/* Monto en ARS con prefijo visual */}
                          <div className="price-item-builder__ars-input">
                            <span className="price-item-builder__ars-prefix">ARS $</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={price.amount}
                              onChange={(e) => handlePriceChange(idx, 'amount', Number(e.target.value))}
                              className="form-input price-item-builder__input-field"
                              required
                            />
                          </div>

                          {/* Conversión USD automática calculada en tiempo real */}
                          <div className="price-item-builder__usd-calc">
                            <span>≈ USD ${Math.round((Number(price.amount) || 0) / 1000).toLocaleString()}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', fontWeight: 400 }}>
                              /{price.interval === 'monthly' ? 'mes' : price.interval === 'quarterly' ? 'trimestre' : 'año'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePrice(idx)}
                            className="action-dots-btn"
                            style={{ color: 'var(--color-danger)' }}
                            title="Eliminar esta periodicidad"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Configuración de Descuento Promocional / Anual */}
                    <div className="plan-discount-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={formDiscountEnabled}
                            onChange={(e) => setFormDiscountEnabled(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                          />
                          <span>Ofrecer descuento comercial / anual</span>
                        </label>
                        {formDiscountEnabled && (
                          <span className="discount-pill-badge">
                            🏷️ {formDiscountPercentage}% OFF • {formDiscountDurationMonths === 0 ? 'Permanente' : `${formDiscountDurationMonths} meses`}
                          </span>
                        )}
                      </div>

                      {formDiscountEnabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                          <div className="form-group">
                            <label>Porcentaje de descuento (%)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={formDiscountPercentage}
                                onChange={(e) => setFormDiscountPercentage(Number(e.target.value))}
                                className="form-input"
                                style={{ paddingRight: 32 }}
                                required
                              />
                              <span style={{ position: 'absolute', right: 12, fontWeight: 700, color: 'var(--color-text-soft)', pointerEvents: 'none' }}>%</span>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Duración del descuento</label>
                            <select
                              value={formDiscountDurationMonths}
                              onChange={(e) => setFormDiscountDurationMonths(Number(e.target.value))}
                              className="form-select"
                            >
                              <option value={3}>Primeros 3 meses</option>
                              <option value={6}>Primeros 6 meses</option>
                              <option value={12}>Primer año (12 meses)</option>
                              <option value={24}>Primeros 2 años (24 meses)</option>
                              <option value={0}>Permanente (indefinido)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* TAB 3: CRÉDITOS Y LÍMITES */}
                {modalActiveTab === 'credits' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanCreditsId}>
                          Créditos mensuales incluidos
                        </label>
                        <input
                          id={createPlanCreditsId}
                          type="number"
                          min="0"
                          step="1000"
                          value={formCreditsMonthly}
                          onChange={(e) => setFormCreditsMonthly(Number(e.target.value))}
                          className="form-input"
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)' }}>
                          Asignación mensual de créditos para consumo de módulos y addons.
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 14 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={formCreditsRollover}
                            onChange={(e) => setFormCreditsRollover(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                          />
                          <span>Habilitar Rollover</span>
                          <HelpTooltip text="Si está activo, los créditos no consumidos en el mes se acumulan para el período siguiente en lugar de vencer." />
                        </label>
                      </div>
                    </div>

                    <h4 style={{ margin: '12px 0 6px 0', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      Límites Operativos de Recursos
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanUsersId}>
                          Máximo de usuarios por tenant
                        </label>
                        <input
                          id={createPlanUsersId}
                          type="number"
                          min="1"
                          value={formLimitUsers}
                          onChange={(e) => setFormLimitUsers(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={createPlanBranchesId}>
                          Máximo de sucursales / locales
                        </label>
                        <input
                          id={createPlanBranchesId}
                          type="number"
                          min="1"
                          value={formLimitBranches}
                          onChange={(e) => setFormLimitBranches(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label htmlFor={createPlanStorageId}>
                          Almacenamiento en nube (GB)
                        </label>
                        <input
                          id={createPlanStorageId}
                          type="number"
                          min="1"
                          value={formLimitStorageGb}
                          onChange={(e) => setFormLimitStorageGb(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={createPlanApiRateId}>
                          Límite de API Rate (req/min)
                          <HelpTooltip text="Límite máximo de peticiones por minuto permitidas hacia la API para prevenir abusos y sobrecargas." />
                        </label>
                        <input
                          id={createPlanApiRateId}
                          type="number"
                          min="10"
                          value={formLimitApiRate}
                          onChange={(e) => setFormLimitApiRate(Number(e.target.value))}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 4: FEATURES / CAPABILITIES */}
                {modalActiveTab === 'features' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                        Features y Módulos Incluidos por Defecto
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setFormIncludedFeatures(allAvailableFeatures.map((f) => f.key))}
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIncludedFeatures([])}
                          className="btn-secondary"
                          style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    <div className="plan-features-selection-grid">
                      {allAvailableFeatures.map((feat) => {
                        const isChecked = formIncludedFeatures.includes(feat.key);
                        return (
                          <label
                            key={feat.key}
                            className={`feature-checkbox-label ${isChecked ? 'feature-checkbox-label--checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleFeature(feat.key)}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{feat.name}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', fontFamily: 'monospace' }}>
                                {feat.key}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="module-config-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Guardando...' : 'Crear Plan Comercial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CAMBIO DE ESTADO */}
      {/* ========================================================================= */}
      {isStatusModalOpen && targetPlan && (
        <div className="catalog-modal-overlay" onClick={() => setIsStatusModalOpen(false)}>
          <div className="catalog-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="module-config-modal-header">
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Cambiar Estado del Plan</h2>
              <button type="button" onClick={() => setIsStatusModalOpen(false)} className="action-dots-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Selecciona el nuevo estado de ciclo de vida para <strong>{targetPlan.name}</strong>:
              </p>
              <div className="form-group">
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as PlanStatus)}
                  className="form-select"
                >
                  <option value="active">Activo (Habilitado para contratación)</option>
                  <option value="draft">Borrador (En preparación interna)</option>
                  <option value="archived">Archivado (Solo lectura histórico)</option>
                </select>
              </div>
            </div>
            <div className="module-config-modal-footer">
              <button type="button" onClick={() => setIsStatusModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleSubmitStatus} disabled={isSaving} className="btn-primary">
                {isSaving ? 'Actualizando...' : 'Confirmar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ARCHIVAR PLAN */}
      {/* ========================================================================= */}
      {isArchiveModalOpen && targetPlan && (
        <div className="catalog-modal-overlay" onClick={() => setIsArchiveModalOpen(false)}>
          <div className="catalog-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="module-config-modal-header">
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-danger)' }}>
                Archivar Plan Comercial
              </h2>
              <button type="button" onClick={() => setIsArchiveModalOpen(false)} className="action-dots-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                ¿Estás seguro de que deseas archivar el plan <strong>{targetPlan.name}</strong>?
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                El plan pasará a estado <code>archived</code> y no estará disponible para nuevas suscripciones de tenants.
              </p>
            </div>
            <div className="module-config-modal-footer">
              <button type="button" onClick={() => setIsArchiveModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitArchive}
                disabled={isSaving}
                className="btn-primary"
                style={{ background: 'var(--color-danger)' }}
              >
                {isSaving ? 'Archivando...' : 'Sí, Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
