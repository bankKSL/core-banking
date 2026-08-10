// ─── Error Response Shape ─────────────────────
// Typical 403/400 body from REST API:
// { developerMessage, httpStatusCode, defaultUserMessage,
//   userMessageGlobalisationCode, errors: [{ developerMessage,
//   defaultUserMessage, userMessageGlobalisationCode,
//   parameterName, args }] }

export interface ErrorDetail {
  developerMessage?: string;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  parameterName?: string;
  args?: unknown[];
}

export interface ErrorResponse {
  developerMessage?: string;
  httpStatusCode?: string;
  defaultUserMessage?: string;
  userMessageGlobalisationCode?: string;
  errors?: ErrorDetail[];
}

/**
 * Extract the first `errors[].defaultUserMessage`
 * API error response. Falls back to the top-level defaultUserMessage,
 * then to `error.message`, then to a generic message.
 */
import i18n from "@/i18n";

export function getErrorMessage(error: unknown): string {
  // 1. Try Axios response body shaped like ErrorResponse
  const axiosErr = error as { response?: { data?: ErrorResponse } };
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
  return i18n.t("An unexpected error occurred.");
}
