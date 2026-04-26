/**
 * Extracts a user-friendly error message from an API error response.
 *
 * Priority order:
 *  1. errors[0].message  — field-level error from the backend
 *  2. response.data.message — top-level backend message
 *  3. fallback string
 *
 * Extensibility:
 *  - Add i18n key lookup: map error codes to translated strings
 *  - Add error code → action mapping (e.g. user_not_found → show signup CTA)
 *  - Add Sentry/analytics capture before returning
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error || typeof error !== 'object') return fallback;

  const axiosError = error as {
    response?: {
      data?: {
        errors?: Array<{ message?: string; code?: string; field?: string }>;
        message?: string;
      };
    };
    message?: string;
  };

  const data = axiosError.response?.data;

  if (data?.errors?.length && data.errors[0].message) {
    return data.errors[0].message;
  }

  if (data?.message) {
    return data.message;
  }

  return fallback;
}
