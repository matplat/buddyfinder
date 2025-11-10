import { useState, useEffect, useMemo, useCallback } from "react";
import type { GeoJsonPoint, ProfileDto, UpdateProfileCommand } from "@/types";
import type { MapViewViewModel } from "../types";

/**
 * Custom hook for managing MapView state and API interactions
 */
export function useMapView() {
  const [state, setState] = useState<MapViewViewModel>({
    profile: null,
    draftLocation: null,
    draftRangeKm: 10, // Default value
    isLoading: true,
    isSaving: false,
    error: null,
  });

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch("/api/profiles/me");

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sesja wygasła. Proszę zalogować się ponownie.");
          }
          throw new Error("Nie udało się załadować danych profilu. Spróbuj odświeżyć stronę.");
        }

        const profile: ProfileDto = await response.json();

        setState((prev) => ({
          ...prev,
          profile,
          draftLocation: profile.location,
          draftRangeKm: profile.default_range_km || 10,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
        }));
      }
    }

    fetchProfile();
  }, []);

  // Calculate if data has been modified
  const isDirty = useMemo(() => {
    if (!state.profile) return false;

    const locationChanged = JSON.stringify(state.draftLocation) !== JSON.stringify(state.profile.location);
    const rangeChanged = state.draftRangeKm !== state.profile.default_range_km;

    return locationChanged || rangeChanged;
  }, [state.profile, state.draftLocation, state.draftRangeKm]);

  // Update draft location
  const setDraftLocation = useCallback((location: GeoJsonPoint) => {
    setState((prev) => ({ ...prev, draftLocation: location }));
  }, []);

  // Update draft range
  const setDraftRangeKm = useCallback((rangeKm: number) => {
    setState((prev) => ({ ...prev, draftRangeKm: rangeKm }));
  }, []);

  // Save changes to the API
  const saveChanges = useCallback(async () => {
    if (!isDirty || state.isSaving) return;

    try {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      const updateData: UpdateProfileCommand = {
        location: state.draftLocation,
        default_range_km: state.draftRangeKm,
      };

      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie, aby zapisać zmiany.");
        }
        throw new Error("Wystąpił nieoczekiwany błąd podczas zapisu. Spróbuj ponownie.");
      }

      const updatedProfile: ProfileDto = await response.json();

      setState((prev) => ({
        ...prev,
        profile: updatedProfile,
        draftLocation: updatedProfile.location,
        draftRangeKm: updatedProfile.default_range_km || 10,
        isSaving: false,
      }));

      return true; // Success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.";
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      throw error; // Re-throw so Toast can display it
    }
  }, [isDirty, state.isSaving, state.draftLocation, state.draftRangeKm]);

  // Retry loading profile after an error
  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, isLoading: true }));
    // Trigger re-fetch by modifying state
    window.location.reload();
  }, []);

  return {
    ...state,
    isDirty,
    setDraftLocation,
    setDraftRangeKm,
    saveChanges,
    retry,
  };
}
