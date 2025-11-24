/**
 * Type definitions for the user data store.
 *
 * This module contains all TypeScript types used by the Zustand store
 * for managing cached user data (profile, sports, location).
 */

import type { ProfileDto, UserSportDto, SportDto } from "@/types";

/**
 * Represents the user's current location and search range.
 */
export interface UserLocation {
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Search range in kilometers */
  range: number;
}

/**
 * State shape for the user data Zustand store.
 * Contains cached user data and methods to manipulate it.
 */
export interface UserDataState {
  // =========================================================================
  // DATA
  // =========================================================================

  /** User's profile data (null if not loaded) */
  profile: ProfileDto | null;

  /** Array of user's sports with parameters */
  sports: UserSportDto[];

  /** List of all available sports (cached from DB) */
  availableSports: SportDto[];

  /** User's current location and range */
  location: UserLocation | null;

  /** Loading state indicator */
  isLoading: boolean;

  /** Error message (null if no error) */
  error: string | null;

  // =========================================================================
  // ACTIONS - INITIALIZATION
  // =========================================================================

  /**
   * Initialize store with SSR data.
   * Called once when MainView mounts with data from index.astro.
   */
  initialize: (data: {
    profile: ProfileDto | null;
    sports: UserSportDto[];
    availableSports: SportDto[];
    location: UserLocation | null;
  }) => void;

  // =========================================================================
  // ACTIONS - PROFILE
  // =========================================================================

  /**
   * Update profile data in cache.
   * Called after successful API update.
   */
  setProfile: (profile: ProfileDto) => void;

  /**
   * Update specific profile fields.
   */
  updateProfile: (updates: Partial<ProfileDto>) => void;

  // =========================================================================
  // ACTIONS - SPORTS
  // =========================================================================

  /**
   * Add a new sport to user's list.
   */
  addSport: (sport: UserSportDto) => void;

  /**
   * Update an existing sport's parameters or range.
   */
  updateSport: (sportId: number, updates: Partial<UserSportDto>) => void;

  /**
   * Remove a sport from user's list.
   */
  removeSport: (sportId: number) => void;

  /**
   * Replace entire sports array.
   */
  setSports: (sports: UserSportDto[]) => void;

  /**
   * Set available sports list (all sports from DB).
   */
  setAvailableSports: (sports: SportDto[]) => void;

  // =========================================================================
  // ACTIONS - LOCATION
  // =========================================================================

  /**
   * Update user's location and/or range.
   */
  setLocation: (location: UserLocation) => void;

  // =========================================================================
  // ACTIONS - STATE MANAGEMENT
  // =========================================================================

  /**
   * Set loading state.
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * Set error message.
   */
  setError: (error: string | null) => void;

  /**
   * Reset store to initial state.
   */
  reset: () => void;
}
