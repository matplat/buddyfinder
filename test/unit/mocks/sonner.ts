/**
 * Mock implementation of sonner toast notifications
 */

import { vi } from "vitest";

export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  promise: vi.fn(),
  custom: vi.fn(),
  message: vi.fn(),
  dismiss: vi.fn(),
};

/**
 * Mock the sonner module
 * Use this in test files with: vi.mock('sonner', () => mockSonner);
 */
export const mockSonner = {
  toast: mockToast,
  Toaster: vi.fn(() => null),
};

/**
 * Reset all toast mocks
 */
export const resetToastMocks = () => {
  Object.values(mockToast).forEach((mock) => {
    if (typeof mock === "function") {
      mock.mockReset();
    }
  });
};
