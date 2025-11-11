import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";
import type { TestUser } from "../fixtures/test-users.fixture";

/**
 * Database helper for E2E tests
 * Provides methods to seed, query, and cleanup test data
 * Uses Supabase service role for admin operations
 */
export class DatabaseHelper {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Create a test user in Supabase Auth and profiles table
   */
  async createTestUser(user: TestUser): Promise<string> {
    // Create user in Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        username: user.username,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;

    // Update profile with additional data
    const { error: profileError } = await this.supabase
      .from("profiles")
      .update({
        username: user.username,
        location: user.location ? `POINT(${user.location.lng} ${user.location.lat})` : null,
        default_range_km: user.defaultRange || null,
        social_links: user.socialLinks || null,
      })
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Add sports if specified
    if (user.sports && user.sports.length > 0) {
      for (const sport of user.sports) {
        await this.addUserSport(userId, sport.sportId, sport.parameters, sport.customRange);
      }
    }

    return userId;
  }

  /**
   * Add a sport to user's profile
   */
  async addUserSport(
    userId: string,
    sportId: number,
    parameters: Record<string, unknown>,
    customRange?: number
  ): Promise<void> {
    const { error } = await this.supabase.from("user_sports").insert({
      user_id: userId,
      sport_id: sportId,
      parameters,
      custom_range_km: customRange || null,
    });

    if (error) {
      throw new Error(`Failed to add user sport: ${error.message}`);
    }
  }

  /**
   * Get user's sports
   */
  async getUserSports(userId: string) {
    const { data, error } = await this.supabase.from("user_sports").select("*, sports(*)").eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to get user sports: ${error.message}`);
    }

    return data;
  }

  /**
   * Get matches for a user (using the get_matches_for_user function)
   */
  async getMatches(userId: string) {
    const { data, error } = await this.supabase.rpc("get_matches_for_user", {
      target_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get matches: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a test user (cleanup)
   */
  async deleteTestUser(userId: string): Promise<void> {
    // Delete user sports first (due to foreign key)
    await this.supabase.from("user_sports").delete().eq("user_id", userId);

    // Delete from auth (will cascade to profiles)
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete test user: ${error.message}`);
    }
  }

  /**
   * Delete all test users (cleanup after test suite)
   */
  async cleanupTestUsers(testEmails: string[]): Promise<void> {
    for (const email of testEmails) {
      try {
        // Get user by email
        const { data: users } = await this.supabase.auth.admin.listUsers();
        const user = users?.users.find((u) => u.email === email);

        if (user) {
          await this.deleteTestUser(user.id);
        }
      } catch (error) {
        // Silently ignore cleanup errors - user might not exist
        // eslint-disable-next-line no-console
        console.error(`Failed to cleanup user ${email}:`, error);
      }
    }
  }

  /**
   * Seed all test users
   */
  async seedAllTestUsers(users: TestUser[]): Promise<Map<string, string>> {
    const userIdMap = new Map<string, string>();

    for (const user of users) {
      try {
        const userId = await this.createTestUser(user);
        userIdMap.set(user.email, userId);
        // eslint-disable-next-line no-console
        console.log(`Created test user: ${user.email} (${userId})`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to create test user ${user.email}:`, error);
        throw error;
      }
    }

    return userIdMap;
  }
}
