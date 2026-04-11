// ─── Feedback Types ───────────────────────────────────────────────────────────

export interface FeedbackPayload {
  rideId: string;
  rating: number;         // 1–5
  comment?: string;       // Optional text
}

export interface FeedbackSubmitResult {
  success: boolean;
  message?: string;
}
