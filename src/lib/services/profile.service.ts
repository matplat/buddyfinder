import type { ProfileDto, UpdateProfileCommand } from "@/types";
import type { supabaseClient } from "@/db/supabase.client";

export class ProfileService {
  constructor(private readonly supabase: typeof supabaseClient) {}

  async getCurrentUserProfile(userId: string): Promise<ProfileDto | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

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
    if (!userId) {
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
      throw error;
    }

    if (!data) {
      throw new Error("Profile not found");
    }

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
