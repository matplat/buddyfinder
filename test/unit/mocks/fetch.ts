/**
 * Mock implementation of global fetch for testing API calls
 */

import { vi } from "vitest";

/**
 * Creates a mock fetch response
 */
export const createMockResponse = <T>(
  data: T,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): Response => {
  const { status = 200, statusText = "OK", headers = {} } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    blob: vi.fn(),
    arrayBuffer: vi.fn(),
    formData: vi.fn(),
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
  } as Response;
};

/**
 * Creates a mock fetch error response
 */
export const createMockErrorResponse = (message: string, status = 500): Response => {
  return createMockResponse({ error: message }, { status, statusText: "Error" });
};

/**
 * Mock fetch function with type safety
 */
export const mockFetch = vi.fn();

/**
 * Setup global fetch mock
 */
export const setupFetchMock = () => {
  global.fetch = mockFetch;
};

/**
 * Reset fetch mock
 */
export const resetFetchMock = () => {
  mockFetch.mockReset();
};
