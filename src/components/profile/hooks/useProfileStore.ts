/**
 * Hook providing profile management with Zustand store integration.
 *
 * Replaces useProfileView with store-based state management.
 * Reads cached data from Zustand store (initialized via SSR) and updates
 * store after successful API mutations.
 *
 * Benefits:
 * - No initial fetch (data from SSR)
 * - Shared state across components
 * - Optimistic updates
 * - Automatic matches refresh after sports changes
 *
 * @example
 * ```tsx
 * const ProfileComponent = () => {
 *   const { profile, userSports, updateDisplayName } = useProfileStore();
 *
 *   return <div>{profile?.display_name}</div>;
 * };
 * ```
 */

import { toast } from "sonner";
import { useUserDataStore } from "@/lib/stores/user-data-store";
import type { ProfileDto, UpdateProfileCommand, AddUserSportCommand, UpdateUserSportCommand } from "@/types";
import type { SocialLinks } from "../types";
import type { UserSportViewModel as UserSportVM } from "@/components/shared/types/sport";
import type { ProfileDataUpdates } from "@/components/main/types";

/**
 * Model widoku profilu użytkownika.
 * Rozszerza ProfileDto o silnie typowane social_links.
 */
export interface ProfileViewModel extends Omit<ProfileDto, "social_links"> {
  /** Silnie typowane linki do mediów społecznościowych */
  social_links: SocialLinks;
}

/**
 * Mapuje DTO profilu na model widoku.
 */
const mapProfileDtoToViewModel = (dto: ProfileDto): ProfileViewModel => ({
  ...dto,
  social_links: (dto.social_links as SocialLinks) || {},
});

/**
 * Mapuje DTO sportu użytkownika na model widoku.
 */
const mapUserSportDtoToViewModel = (dto: {
  sport_id: number;
  name: string;
  parameters: unknown;
  custom_range_km: number | null;
}): UserSportVM => ({
  sport_id: dto.sport_id,
  sport_name: dto.name,
  custom_range_km: dto.custom_range_km,
  params: dto.parameters as Record<string, string | number>,
});

export interface UseProfileStoreProps {
  /** Callback when profile data changes that affects matches */
  onDataChange?: (updates: ProfileDataUpdates) => void;
}

/**
 * Hook for profile management with store integration.
 */
export const useProfileStore = (props?: UseProfileStoreProps) => {
  const { onDataChange } = props || {};

  // Read from store (selector for optimal re-renders)
  const profile = useUserDataStore((state) => state.profile);
  const sports = useUserDataStore((state) => state.sports);
  const allSports = useUserDataStore((state) => state.availableSports);
  const isLoading = useUserDataStore((state) => state.isLoading);

  // Actions from store
  const setProfileInStore = useUserDataStore((state) => state.setProfile);
  const addSportToStore = useUserDataStore((state) => state.addSport);
  const updateSportInStore = useUserDataStore((state) => state.updateSport);
  const removeSportFromStore = useUserDataStore((state) => state.removeSport);

  // Map profile to view model
  const profileViewModel = profile ? mapProfileDtoToViewModel(profile) : null;

  // Map sports to view models
  const userSports = sports.map(mapUserSportDtoToViewModel);

  /**
   * Updates display name in profile
   */
  const updateDisplayName = async (newName: string) => {
    if (!profile) return;

    try {
      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: newName } as UpdateProfileCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update display name");
      }

      const updatedProfile: ProfileDto = await response.json();
      setProfileInStore(updatedProfile);
      toast.success("Nazwa wyświetlana została zaktualizowana");
    } catch (error) {
      console.error("Error updating display name:", error);
      toast.error("Nie udało się zaktualizować nazwy");
    }
  };

  /**
   * Adds a social link to profile
   */
  const addSocialLink = async (platform: string, url: string) => {
    if (!profile) return;

    try {
      const currentLinks =
        typeof profile.social_links === "object" && profile.social_links !== null
          ? (profile.social_links as Record<string, unknown>)
          : {};
      const updatedLinks = {
        ...currentLinks,
        [platform]: url,
      };

      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: updatedLinks } as UpdateProfileCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add social link");
      }

      const updatedProfile: ProfileDto = await response.json();
      setProfileInStore(updatedProfile);
      toast.success("Link został dodany");
    } catch (error) {
      console.error("Error adding social link:", error);
      toast.error("Nie udało się dodać linku");
    }
  };

  /**
   * Edits an existing social link
   */
  const editSocialLink = async (platform: string, url: string) => {
    if (!profile) return;

    try {
      const currentLinks =
        typeof profile.social_links === "object" && profile.social_links !== null
          ? (profile.social_links as Record<string, unknown>)
          : {};
      const updatedLinks = {
        ...currentLinks,
        [platform]: url,
      };

      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: updatedLinks } as UpdateProfileCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to edit social link");
      }

      const updatedProfile: ProfileDto = await response.json();
      setProfileInStore(updatedProfile);
      toast.success("Link został zaktualizowany");
    } catch (error) {
      console.error("Error editing social link:", error);
      toast.error("Nie udało się zaktualizować linku");
    }
  };

  /**
   * Deletes a social link from profile
   */
  const deleteSocialLink = async (platform: string) => {
    if (!profile) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [platform]: _removed, ...remainingLinks } = profile.social_links as Record<string, string>;

      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: remainingLinks } as UpdateProfileCommand),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete social link");
      }

      const updatedProfile: ProfileDto = await response.json();
      setProfileInStore(updatedProfile);
      toast.success("Link został usunięty");
    } catch (error) {
      console.error("Error deleting social link:", error);
      toast.error("Nie udało się usunąć linku");
    }
  };

  /**
   * Adds a sport to user's profile
   */
  const addSport = async (data: AddUserSportCommand) => {
    try {
      const response = await fetch("/api/profiles/me/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add sport");
      }

      const newSport = await response.json();
      addSportToStore(newSport);
      toast.success("Sport został dodany do Twojego profilu");

      // Notify parent about sports change (triggers matches refresh)
      onDataChange?.({ sportsChanged: true });
    } catch (error) {
      console.error("Error adding sport:", error);
      toast.error("Nie udało się dodać sportu");
    }
  };

  /**
   * Updates a sport in user's profile
   */
  const editSport = async (sportId: number, data: UpdateUserSportCommand) => {
    try {
      const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to edit sport");
      }

      const updatedSport = await response.json();
      updateSportInStore(sportId, updatedSport);
      toast.success("Sport został zaktualizowany");

      // Notify parent about sports change (triggers matches refresh)
      onDataChange?.({ sportsChanged: true });
    } catch (error) {
      console.error("Error editing sport:", error);
      toast.error("Nie udało się zaktualizować sportu");
    }
  };

  /**
   * Deletes a sport from user's profile
   */
  const deleteSport = async (sportId: number) => {
    try {
      const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete sport");
      }

      removeSportFromStore(sportId);
      toast.success("Sport został usunięty z Twojego profilu");

      // Notify parent about sports change (triggers matches refresh)
      onDataChange?.({ sportsChanged: true });
    } catch (error) {
      console.error("Error deleting sport:", error);
      toast.error("Nie udało się usunąć sportu");
    }
  };

  return {
    profile: profileViewModel,
    userSports,
    allSports,
    loading: isLoading,
    updateDisplayName,
    addSocialLink,
    editSocialLink,
    deleteSocialLink,
    addSport,
    editSport,
    deleteSport,
  };
};
