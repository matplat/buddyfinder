import type { UserSportDto, AddUserSportCommand } from "../../types";
import type { supabaseClient } from "../../db/supabase.client";

/**
 * Error thrown when attempting to add a sport that doesn't exist
 */
export class SportNotFoundError extends Error {
  constructor(sportId: number) {
    super(`Sport with id ${sportId} not found`);
    this.name = "SportNotFoundError";
  }
}

/**
 * Error thrown when attempting to add a sport that user already has
 */
export class DuplicateSportError extends Error {
  constructor(sportId: number) {
    super(`User already has sport with id ${sportId}`);
    this.name = "DuplicateSportError";
  }
}

export class UserSportService {
  constructor(private readonly supabase: typeof supabaseClient) {}

  /**
   * Retrieves all sports associated with a user, including their custom parameters and ranges
   * @param userId The ID of the user whose sports to retrieve
   * @throws {Error} If userId is not provided
   * @throws {PostgrestError} If the database query fails
   * @returns Array of UserSportDto objects
   */
  async getUserSports(userId: string): Promise<UserSportDto[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { data, error } = await this.supabase
      .from("user_sports")
      .select(
        `
        sport_id,
        parameters,
        custom_range_km,
        sports (
          name
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format from database");
    }

    // Map database result to DTOs using the predefined UserSportDto type
    return data.map((item) => ({
      sport_id: item.sport_id,
      name: item.sports.name,
      parameters: item.parameters,
      custom_range_km: item.custom_range_km,
    }));
  }

  /**
   * Adds a new sport to user's profile
   *
   * @throws {SportNotFoundError} If sport with given id doesn't exist
   * @throws {DuplicateSportError} If user already has this sport
   * @throws {Error} If userId is not provided
   * @throws {PostgrestError} If the database query fails
   */
  async addUserSport(userId: string, command: AddUserSportCommand): Promise<UserSportDto> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if sport exists
    const { data: sport, error: sportError } = await this.supabase
      .from("sports")
      .select("id")
      .eq("id", command.sport_id)
      .single();

    if (sportError || !sport) {
      throw new SportNotFoundError(command.sport_id);
    }

    // Check if user already has this sport
    const { data: existingSport, error: existingError } = await this.supabase
      .from("user_sports")
      .select("id")
      .eq("user_id", userId)
      .eq("sport_id", command.sport_id)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    if (existingSport) {
      throw new DuplicateSportError(command.sport_id);
    }

    // Add new sport to user's profile
    const { data: newUserSport, error: insertError } = await this.supabase
      .from("user_sports")
      .insert({
        user_id: userId,
        sport_id: command.sport_id,
        parameters: command.parameters,
        custom_range_km: command.custom_range_km,
      })
      .select(
        `
        sport_id,
        parameters,
        custom_range_km,
        sports (
          name
        )
      `
      )
      .single();

    if (insertError || !newUserSport) {
      throw insertError || new Error("Failed to create user sport");
    }

    return {
      sport_id: newUserSport.sport_id,
      name: newUserSport.sports.name,
      parameters: newUserSport.parameters,
      custom_range_km: newUserSport.custom_range_km,
    };
  }
}
