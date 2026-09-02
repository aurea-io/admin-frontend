import { useCapabilitiesStore } from '../stores/capabilitiesStore';
import { useShallow } from 'zustand/shallow';

export function useCapability(key: string): boolean {
  return useCapabilitiesStore((state) => state.hasCapability(key));
}

export function useCapabilities() {
  return useCapabilitiesStore(useShallow((state) => ({
    capabilities: state.capabilities,
    isLoading: state.isLoading,
    error: state.error,
    hasCapability: state.hasCapability,
  })));
}
