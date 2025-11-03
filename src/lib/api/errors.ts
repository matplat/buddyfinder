import type { ZodError } from "zod";

/**
 * Standard error response structure for API errors
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Error codes for API responses
 */
export const ApiErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Creates a standard error response object
 */
export function createErrorResponse(code: keyof typeof ApiErrorCode, message: string, details?: unknown): Response {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: ApiErrorCode[code],
      message,
      details: details || undefined,
    },
  };

  const status = getHttpStatusForErrorCode(code);

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates an error response for Zod validation errors
 */
export function createValidationErrorResponse(error: ZodError): Response {
  return createErrorResponse("VALIDATION_ERROR", "Invalid request data", error.issues);
}

/**
 * Maps API error codes to HTTP status codes
 */
function getHttpStatusForErrorCode(code: keyof typeof ApiErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "NOT_FOUND":
      return 404;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 500;
  }
}
