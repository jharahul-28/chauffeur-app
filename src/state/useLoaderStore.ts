import { useState, useEffect } from 'react';

// Module-level counter shared across all instances — no React context needed.
let activeRequests = 0;
const listeners = new Set<(isLoading: boolean) => void>();

function notify(): void {
  const isLoading = activeRequests > 0;
  listeners.forEach((cb) => cb(isLoading));
}

export function incrementLoader(): void {
  activeRequests++;
  notify();
}

export function decrementLoader(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
}

/**
 * Returns true whenever one or more API requests are in-flight.
 * Automatically wires into the module-level counter updated by apiClient interceptors.
 *
 * Extensibility: swap this observer pattern for Zustand/Redux without changing
 * the incrementLoader/decrementLoader call-sites.
 */
export function useIsLoading(): boolean {
  const [isLoading, setIsLoading] = useState(activeRequests > 0);

  useEffect(() => {
    listeners.add(setIsLoading);
    return () => {
      listeners.delete(setIsLoading);
    };
  }, []);

  return isLoading;
}
