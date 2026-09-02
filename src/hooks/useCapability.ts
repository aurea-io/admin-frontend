import { useCapabilitiesStore } from '../stores/capabilitiesStore';

export function useCapability(key: string): boolean {
  return useCapabilitiesStore((state) => state.hasCapability(key));
}

export function useCapabilities() {
  return useCapabilitiesStore((state) => ({
    capabilities: state.capabilities,
    isLoading: state.isLoading,
    error: state.error,
    hasCapability: state.hasCapability,
  }));
}
