/**
 * Zustand store for managing cached user data.
 *
 * This store acts as a client-side cache for:
 * - User profile (from profiles table)
 * - User sports (from user_sports table)
 * - Current location and range
 *
 * Data is initialized with SSR data from index.astro and updated
 * after successful API mutations. This ensures UI always reflects
 * the latest state without unnecessary refetches.
 *
 * @example
 * ```tsx
 * import { useUserDataStore } from '@/lib/stores/user-data-store';
 *
 * const MyComponent = () => {
 *   const profile = useUserDataStore(state => state.profile);
 *   const updateProfile = useUserDataStore(state => state.updateProfile);
 *
 *   // Use profile data
 *   // Call updateProfile after successful API call
 * }
 * ```
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UserDataState } from "./types";

/**
 * Initial state for the store.
 * All data is null/empty until initialized with SSR data.
 */
const initialState = {
  profile: null,
  sports: [],
  availableSports: [],
  location: null,
  isLoading: false,
  error: null,
};

/**
 * Zustand store for user data cache.
 *
 * Wrapped with devtools middleware in development for debugging.
 */
export const useUserDataStore = create<UserDataState>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,

      // =========================================================================
      // INITIALIZATION
      // =========================================================================

      initialize: (data) => {
        set(
          {
            profile: data.profile,
            sports: data.sports,
            availableSports: data.availableSports,
            location: data.location,
            isLoading: false,
            error: null,
          },
          false,
          "initialize"
        );
      },

      // =========================================================================
      // PROFILE ACTIONS
      // =========================================================================

      setProfile: (profile) => {
        set({ profile }, false, "setProfile");
      },

      updateProfile: (updates) => {
        set(
          (state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }),
          false,
          "updateProfile"
        );
      },

      // =========================================================================
      // SPORTS ACTIONS
      // =========================================================================

      addSport: (sport) => {
        set(
          (state) => ({
            sports: [...state.sports, sport],
          }),
          false,
          "addSport"
        );
      },

      updateSport: (sportId, updates) => {
        set(
          (state) => ({
            sports: state.sports.map((sport) => (sport.sport_id === sportId ? { ...sport, ...updates } : sport)),
          }),
          false,
          "updateSport"
        );
      },

      removeSport: (sportId) => {
        set(
          (state) => ({
            sports: state.sports.filter((sport) => sport.sport_id !== sportId),
          }),
          false,
          "removeSport"
        );
      },

      setSports: (sports) => {
        set({ sports }, false, "setSports");
      },

      setAvailableSports: (sports) => {
        set({ availableSports: sports }, false, "setAvailableSports");
      },

      // =========================================================================
      // LOCATION ACTIONS
      // =========================================================================

      setLocation: (location) => {
        set({ location }, false, "setLocation");
      },

      // =========================================================================
      // STATE MANAGEMENT
      // =========================================================================

      setLoading: (isLoading) => {
        set({ isLoading }, false, "setLoading");
      },

      setError: (error) => {
        set({ error }, false, "setError");
      },

      reset: () => {
        set(initialState, false, "reset");
      },
    }),
    {
      name: "user-data-store",
      enabled: import.meta.env.DEV,
    }
  )
);
