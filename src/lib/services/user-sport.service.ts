import type { Json } from "@/db/database.types";
import type { UserSportDto, AddUserSportCommand, UpdateUserSportCommand } from "@/types";
import type { supabaseClient } from "@/db/supabase.client";
import { createLogger } from "@/lib/logger";

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

/**
 * Error thrown when attempting to update a sport that user doesn't have
 */
export class UserSportNotFoundError extends Error {
  constructor(sportId: number) {
    super(`Sport with id ${sportId} not found in user's profile`);
    this.name = "UserSportNotFoundError";
  }
}

export class UserSportService {
  private readonly logger = createLogger("UserSportService");

  constructor(private readonly supabase: typeof supabaseClient) {}

  /**
   * Updates a sport in user's profile
   *
   * @param userId The ID of the user whose sport to update
   * @param sportId The ID of the sport to update
   * @param command The update command containing the new values
   * @throws {UserSportNotFoundError} If user doesn't have this sport
   * @throws {Error} If userId is not provided
   * @throws {PostgrestError} If the database query fails
   * @returns Updated UserSportDto
   */
  async updateUserSport(userId: string, sportId: number, command: UpdateUserSportCommand): Promise<UserSportDto> {
    this.logger.info("Updating user sport", { userId, sportId, updateFields: Object.keys(command) });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
      throw new Error("User ID is required");
    }

    // Build update object based on provided fields
    const updateData: { parameters?: Json; custom_range_km?: number | null } = {};

    if (command.parameters) {
      updateData.parameters = command.parameters;
    }
    if (command.custom_range_km !== undefined) {
      updateData.custom_range_km = command.custom_range_km;
    }

    // Update the sport and return updated data
    const { data: updatedUserSport, error: updateError } = await this.supabase
      .from("user_sports")
      .update(updateData)
      .eq("user_id", userId)
      .eq("sport_id", sportId)
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

    if (updateError) {
      this.logger.error("Failed to update user sport", { userId, sportId, error: updateError });
      throw updateError;
    }

    if (!updatedUserSport) {
      this.logger.warn("User sport not found", { userId, sportId });
      throw new UserSportNotFoundError(sportId);
    }

    this.logger.info("Successfully updated user sport", { userId, sportId });

    return {
      sport_id: updatedUserSport.sport_id,
      name: updatedUserSport.sports.name,
      parameters: updatedUserSport.parameters,
      custom_range_km: updatedUserSport.custom_range_km,
    };
  }

  /**
   * Retrieves all sports associated with a user, including their custom parameters and ranges
   * @param userId The ID of the user whose sports to retrieve
   * @throws {Error} If userId is not provided
   * @throws {PostgrestError} If the database query fails
   * @returns Array of UserSportDto objects
   */
  async getUserSports(userId: string): Promise<UserSportDto[]> {
    this.logger.info("Fetching user sports", { userId });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
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
      this.logger.error("Failed to fetch user sports", { userId, error });
      throw error;
    }

    if (!Array.isArray(data)) {
      this.logger.error("Invalid response format from database", { userId });
      throw new Error("Invalid response format from database");
    }

    this.logger.info("Successfully fetched user sports", { userId, count: data.length });

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
    this.logger.info("Adding sport to user profile", { userId, sportId: command.sport_id });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
      throw new Error("User ID is required");
    }

    // Check if sport exists
    const { data: sport, error: sportError } = await this.supabase
      .from("sports")
      .select("id")
      .eq("id", command.sport_id)
      .single();

    if (sportError || !sport) {
      this.logger.warn("Sport not found", { sportId: command.sport_id });
      throw new SportNotFoundError(command.sport_id);
    }

    // Check if user already has this sport
    const { data: existingSport, error: existingError } = await this.supabase
      .from("user_sports")
      .select("sport_id")
      .eq("user_id", userId)
      .eq("sport_id", command.sport_id)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      this.logger.error("Failed to check existing sport", { userId, sportId: command.sport_id, error: existingError });
      throw existingError;
    }

    if (existingSport) {
      this.logger.warn("User already has this sport", { userId, sportId: command.sport_id });
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
      this.logger.error("Failed to add sport to user profile", {
        userId,
        sportId: command.sport_id,
        error: insertError,
      });
      throw insertError || new Error("Failed to create user sport");
    }

    this.logger.info("Successfully added sport to user profile", { userId, sportId: command.sport_id });

    return {
      sport_id: newUserSport.sport_id,
      name: newUserSport.sports.name,
      parameters: newUserSport.parameters,
      custom_range_km: newUserSport.custom_range_km,
    };
  }

  /**
   * Deletes a sport from user's profile
   * @param userId The ID of the user whose sport to delete
   * @param sportId The ID of the sport to delete
   * @throws {UserSportNotFoundError} If user doesn't have this sport
   * @throws {Error} If userId or sportId is not provided
   * @throws {PostgrestError} If the database operation fails
   */
  async deleteUserSport(userId: string, sportId: number): Promise<void> {
    this.logger.info("Deleting sport from user profile", { userId, sportId });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
      throw new Error("User ID is required");
    }
    if (!sportId || isNaN(sportId)) {
      this.logger.error("Valid sport ID is required but was not provided", { sportId });
      throw new Error("Valid sport ID is required");
    }

    // Delete the sport from user's profile
    const { error } = await this.supabase
      .from("user_sports")
      .delete()
      .match({ user_id: userId, sport_id: sportId });

    // Handle database errors
    if (error) {
      this.logger.error("Failed to delete sport from user profile", { userId, sportId, error });
      throw error;
    }

    this.logger.info("Successfully deleted sport from user profile", { userId, sportId });
  }
}
