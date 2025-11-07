import type { GeoJsonPoint, ProfileDto } from "@/types";

/**
 * Represents the complete state of the MapView component
 */
export interface MapViewViewModel {
  /** The user's complete profile data */
  profile: ProfileDto | null;
  /** Draft location being edited (not yet saved) */
  draftLocation: GeoJsonPoint | null;
  /** Draft range in km being edited (not yet saved) */
  draftRangeKm: number;
  /** Whether data is currently being loaded from the API */
  isLoading: boolean;
  /** Whether data is currently being saved to the API */
  isSaving: boolean;
  /** Error message if an error occurred during loading or saving */
  error: string | null;
}
