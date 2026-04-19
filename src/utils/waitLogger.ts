// ─── Types ────────────────────────────────────────────────────────────────────

export type WaitEventType = 'WAIT_START' | 'WAIT_RESUME';

interface WaitLogPayload {
  type: WaitEventType;
  timestamp: string;
  rideId?: string;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Logs a wait lifecycle event to the console.
 *
 * Extensibility:
 *  - Replace the console.log with a POST to /audit/wait-events for backend tracking
 *  - Add sessionId, driverId, and coordinates for richer audit trails
 *  - Wire into an analytics pipeline (Mixpanel, Amplitude, etc.)
 *
 * @param type    - "WAIT_START" when driver begins waiting,
 *                  "WAIT_RESUME" when driver resumes the trip
 * @param rideId  - Optional ride identifier for correlation
 */
export function logWaitEvent(type: WaitEventType, rideId?: string): void {
  const payload: WaitLogPayload = {
    type,
    timestamp: new Date().toISOString(),
    rideId,
  };

  const rideContext = rideId ? ` | rideId: ${rideId}` : '';
  console.log(`[WaitLogger] ${type} at ${payload.timestamp}${rideContext}`);

  // Future: await postWaitEvent(payload);
}
