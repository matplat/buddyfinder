import type { SportDto } from "@/types";
import type { supabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";

export class SportService {
  constructor(private readonly supabase: typeof supabaseClient) {
    if (!supabase) {
      throw new Error("Supabase client is required");
    }
  }

  /**
   * Retrieves all available sports from the database
   * @returns Promise resolving to an array of SportDto objects
   * @throws {PostgrestError} If the database query fails
   */
  public async getAllSports(): Promise<SportDto[]> {
    const { data, error } = await this.supabase.from("sports").select("*");

    if (error) {
      throw error; // Preserve the original error type
    }

    if (!data) {
      return [];
    }

    // Map database type to DTO with proper type safety
    return data.map(
      (sport: Database["public"]["Tables"]["sports"]["Row"]): SportDto => ({
        id: sport.id,
        name: sport.name,
      })
    );
  }
}
