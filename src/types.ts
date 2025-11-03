/**
 * This file contains the Data Transfer Object (DTO) and Command Model types
 * for the BuddyFinder API. These types are derived from the database
 * models to ensure consistency and type safety between the API layer and
 * the database.
 */

import type { Tables, TablesInsert } from "./db/database.types";

// ############################################################################
// #
// # UTILITY AND BASE TYPES
// #
// ############################################################################

/**
 * Represents a GeoJSON Point, used for storing geographic locations.
 * The coordinates are in [longitude, latitude] order.
 */
export interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number];
}

/**
 * A generic type for paginated API responses.
 * @template T The type of the items in the data array.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PaginationDto {
  total: number;
  limit: number;
  offset: number;
}

// ############################################################################
// #
// # PROFILE-RELATED TYPES
// #
// ############################################################################

/**
 * DTO for a user's public profile.
 * This type is derived from the 'profiles' table, with the 'location'
 * property typed as a GeoJsonPoint.
 */
export type ProfileDto = Omit<Tables<"profiles">, "location"> & {
  location: GeoJsonPoint | null;
};

/**
 * Command model for updating a user's profile.
 * It includes only the fields that are mutable by the user.
 */
export type UpdateProfileCommand = Partial<
  Pick<ProfileDto, "display_name" | "default_range_km" | "social_links" | "location">
>;

// ############################################################################
// #
// # SPORT-RELATED TYPES
// #
// ############################################################################

/**
 * DTO for a sport. Directly maps to the 'sports' table structure.
 */
export type SportDto = Tables<"sports">;

/**
 * DTO for a sport associated with a user, including custom parameters and range.
 * It combines data from 'user_sports' and the sport's 'name' from the 'sports' table.
 */
export type UserSportDto = Omit<Tables<"user_sports">, "user_id"> & {
  name: string;
};

/**
 * Command model for adding a new sport to a user's profile.
 * The 'user_id' is omitted as it will be derived from the authenticated session.
 */
export type AddUserSportCommand = Omit<TablesInsert<"user_sports">, "user_id">;

/**
 * Command model for updating a user's sport-specific settings.
 * Allows partial updates to parameters and custom range.
 */
export type UpdateUserSportCommand = Partial<Pick<Tables<"user_sports">, "parameters" | "custom_range_km">>;

// ############################################################################
// #
// # MATCHING-RELATED TYPES
// #
// ############################################################################

/**
 * DTO for a matched user.
 * This is a composite type that includes a subset of the user's profile,
 * the calculated distance, and the list of sports they have in common.
 *
 * Note: The 'email' field is included as specified in the API plan,
 * even though it is not in the 'profiles' table type. It will be populated
 * from the 'auth.users' table.
 */
export type MatchedUserDto = Pick<ProfileDto, "id" | "username" | "display_name" | "social_links"> & {
  /** The user's email address. */
  email: string;
  /** The calculated distance in kilometers from the current user. */
  distance_km: number;
  /** The list of sports the matched user has. */
  sports: UserSportDto[];
};

// Główny obiekt odpowiedzi
export interface GetMatchesResponseDto {
  data: MatchedUserDto[];
  pagination: PaginationDto;
}
