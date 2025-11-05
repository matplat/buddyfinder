import type { SportDto } from "@/types";
import type { supabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";
import { createLogger } from "@/lib/logger";

export class SportService {
  private readonly logger = createLogger("SportService");

  constructor(private readonly supabase: typeof supabaseClient) {
    if (!supabase) {
      this.logger.error("Supabase client is required but was not provided");
      throw new Error("Supabase client is required");
    }
  }

  /**
   * Retrieves all available sports from the database
   * @returns Promise resolving to an array of SportDto objects
   * @throws {PostgrestError} If the database query fails
   */
  public async getAllSports(): Promise<SportDto[]> {
    this.logger.info("Fetching all sports");

    const { data, error } = await this.supabase.from("sports").select("*");

    if (error) {
      this.logger.error("Failed to fetch sports", { error });
      throw error; // Preserve the original error type
    }

    if (!data) {
      this.logger.warn("No sports found in database");
      return [];
    }

    this.logger.info("Successfully fetched sports", { count: data.length });

    // Map database type to DTO with proper type safety
    return data.map(
      (sport: Database["public"]["Tables"]["sports"]["Row"]): SportDto => ({
        id: sport.id,
        name: sport.name,
      })
    );
  }
}
