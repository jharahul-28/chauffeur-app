import { create } from 'zustand';

interface LoaderState {
  activeRequests: number;
  increment: () => void;
  decrement: () => void;
}

const useLoaderState = create<LoaderState>((set) => ({
  activeRequests: 0,
  increment: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  decrement: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
}));

export function incrementLoader(): void {
  useLoaderState.getState().increment();
}

export function decrementLoader(): void {
  useLoaderState.getState().decrement();
}

/**
 * Returns true whenever one or more API requests are in-flight.
 * Uses Zustand under the hood for reactive updates.
 */
export function useIsLoading(): boolean {
  return useLoaderState((state) => state.activeRequests > 0);
}
