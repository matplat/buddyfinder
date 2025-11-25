import type { ProfileDto, UpdateProfileCommand } from "@/types";
import type { SupabaseClient } from "@/db/supabase.server";
import { createLogger } from "@/lib/logger";

export class ProfileService {
  private readonly logger = createLogger("ProfileService");

  constructor(private readonly supabase: SupabaseClient) {}

  async getCurrentUserProfile(userId: string): Promise<ProfileDto | null> {
    this.logger.info("Fetching user profile", { userId });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
      throw new Error("User ID is required");
    }

    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      this.logger.error("Failed to fetch user profile", { userId, error });
      throw error;
    }

    if (!data) {
      this.logger.warn("User profile not found", { userId });
      return null;
    }

    this.logger.info("Successfully fetched user profile", { userId });

    // Map database type to DTO with proper type safety
    const profile: ProfileDto = {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      location: data.location,
      default_range_km: data.default_range_km,
      social_links: data.social_links,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return profile;
  }

  /**
   * Updates the user's profile with the provided data
   * @throws {PostgrestError} If the database update fails
   */
  async updateUserProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDto> {
    this.logger.info("Updating user profile", { userId, updateFields: Object.keys(command) });

    if (!userId) {
      this.logger.error("User ID is required but was not provided");
      throw new Error("User ID is required");
    }

    // Prepare update data with timestamp
    const updateData = {
      ...command,
      updated_at: new Date().toISOString(),
    };

    // Update profile in database
    const { data, error } = await this.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to update user profile", { userId, error });
      throw error;
    }

    if (!data) {
      this.logger.error("Profile not found after update", { userId });
      throw new Error("Profile not found");
    }

    this.logger.info("Successfully updated user profile", { userId });

    // Map to DTO and return
    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      location: data.location,
      default_range_km: data.default_range_km,
      social_links: data.social_links,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
