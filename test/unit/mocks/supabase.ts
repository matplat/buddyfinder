/**
 * Mock implementation of Supabase client for testing
 */

import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.server";

/**
 * Creates a mock Supabase client with typed methods
 */
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockAuth = {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  };

  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockMatch = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();

  // Chain methods for fluent API
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
    single: mockSingle,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
    match: mockMatch,
  });

  mockEq.mockReturnValue({
    eq: mockEq,
    select: mockSelect,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  const mockClient = {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
  } as unknown as SupabaseClient;

  return {
    mockClient,
    mocks: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      match: mockMatch,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange,
    },
  };
};

/**
 * Default mock Supabase client instance
 */
export const { mockClient: mockSupabaseClient, mocks: supabaseMocks } = createMockSupabaseClient();
