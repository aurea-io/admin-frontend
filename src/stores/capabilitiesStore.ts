import { create } from 'zustand';
import type { CapabilitiesResponse } from '../types/auth';

interface CapabilitiesState {
  capabilities: CapabilitiesResponse;
  isLoading: boolean;
  error: string | null;
  setCapabilities: (capabilities: CapabilitiesResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasCapability: (key: string) => boolean;
  reset: () => void;
}

export const useCapabilitiesStore = create<CapabilitiesState>((set, get) => ({
  capabilities: {},
  isLoading: false,
  error: null,
  setCapabilities: (capabilities: CapabilitiesResponse) => {
    set({ capabilities, error: null });
  },
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  setError: (error: string | null) => {
    set({ error });
  },
  hasCapability: (key: string) => {
    const { capabilities } = get();
    return capabilities[key] === true;
  },
  reset: () => {
    set({ capabilities: {}, isLoading: false, error: null });
  },
}));
