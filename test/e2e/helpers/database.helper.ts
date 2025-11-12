import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/db/database.types";

interface SeedUserSportInput {
  userEmail: string;
  sportName: string;
  customRangeKm?: number;
  parameters?: Record<string, unknown>;
}

/**
 * Helper zarządzający danymi testowymi w Supabase na potrzeby testów E2E US-004.
 * - Wykorzystuje klucz SERVICE_ROLE do modyfikacji danych.
 * - Zapewnia idempotentność przez czyszczenie danych przed seedem.
 */
export class DatabaseHelper {
  readonly client: SupabaseClient<Database>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    this.client = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Usuwa wszystkie sporty przypisane do użytkownika.
   */
  async clearUserSports(userEmail: string): Promise<void> {
    const userId = await this.getUserId(userEmail);

    if (!userId) {
      return;
    }

    await this.client
      .from("user_sports")
      .delete()
      .eq("user_id", userId);
  }

  /**
   * Zapewnia istnienie wpisu w słowniku sportów.
   */
  async ensureSportExists(sportName: string): Promise<number> {
    const { data, error } = await this.client
      .from("sports")
      .select("id")
      .eq("name", sportName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Sport ${sportName} not found. Ensure migrations are applied.`);
    }

    return data.id;
  }

  /**
   * Seeduje użytkownika testowego danymi sportowymi.
   */
  async seedTestUserWithSports(entries: SeedUserSportInput[]): Promise<void> {
    for (const entry of entries) {
      const userId = await this.getUserId(entry.userEmail);
      if (!userId) {
        throw new Error(`User with email ${entry.userEmail} not found in auth.users`);
      }
      const sportId = await this.ensureSportExists(entry.sportName);

      await this.client
        .from("user_sports")
        .delete()
        .eq("user_id", userId)
        .eq("sport_id", sportId);

      const payload: Database["public"]["Tables"]["user_sports"]["Insert"] = {
        user_id: userId,
        sport_id: sportId,
        custom_range_km: entry.customRangeKm ?? null,
        parameters: (entry.parameters ?? {}) as Json,
      };

      await this.client.from("user_sports").insert(payload);
    }
  }

  async getUserId(email: string): Promise<string | null> {
    const { data, error } = await this.client.auth.admin.listUsers({ email });

    if (error) {
      throw error;
    }

    const user = data?.users?.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    return user?.id ?? null;
  }
}
