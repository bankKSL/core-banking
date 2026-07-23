// ─── Finfact Error Response Shape ─────────────────────
// Typical 403/400 body from Fineract REST API:
// { developerMessage, httpStatusCode, defaultUserMessage,
//   userMessageGlobalisationCode, errors: [{ developerMessage,
//   defaultUserMessage, userMessageGlobalisationCode,
//   parameterName, args }] }

export interface FineractErrorDetail {
  developerMessage?: string;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  parameterName?: string;
  args?: unknown[];
}

export interface FineractErrorResponse {
  developerMessage?: string;
  httpStatusCode?: string;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  errors?: FineractErrorDetail[];
}

/**
 * Extract the first `errors[].defaultUserMessage` from a Fineract
 * API error response. Falls back to the top-level defaultUserMessage,
 * then to `error.message`, then to a generic message.
 */
export function getFineractErrorMessage(error: unknown): string {
  // 1. Try Axios response body shaped like FineractErrorResponse
  const axiosErr = error as { response?: { data?: FineractErrorResponse } };
  if (axiosErr.response?.data) {
    const body = axiosErr.response.data;
    // First array item
    if (body.errors?.length && body.errors[0].defaultUserMessage) {
      return body.errors[0].defaultUserMessage;
    }
    // Top-level defaultUserMessage
    if (body.defaultUserMessage) {
      return body.defaultUserMessage;
    }
  }

  // 2. Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // 3. Unknown shape
  return "An unexpected error occurred.";
}
