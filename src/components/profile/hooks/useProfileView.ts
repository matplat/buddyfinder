/**
 * Hook zarządzający stanem i logiką biznesową widoku profilu użytkownika.
 * 
 * Zapewnia:
 * - Pobieranie i synchronizację danych profilu
 * - Operacje CRUD na danych profilu i sportach
 * - Obsługę błędów i powiadomień
 * - Mapowanie typów między DTO a modelami widoku
 * 
 * @returns {Object} Obiekt zawierający stan i metody do zarządzania profilem
 * 
 * @example
 * ```tsx
 * const ProfileComponent = () => {
 *   const {
 *     profile,
 *     loading,
 *     updateDisplayName,
 *     addSocialLink
 *   } = useProfileView();
 * 
 *   if (loading) return <LoadingSpinner />;
 * 
 *   return (
 *     <div>
 *       <h1>{profile.display_name}</h1>
 *       ...
 *     </div>
 *   );
 * };
 * ```
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { ProfileDto, SportDto, UserSportDto, UpdateProfileCommand, AddUserSportCommand, UpdateUserSportCommand } from '@/types';
import type { SocialLinks } from '../types';

/**
 * Model widoku profilu użytkownika.
 * Rozszerza ProfileDto o silnie typowane social_links.
 */
export interface ProfileViewModel extends Omit<ProfileDto, 'social_links'> {
  /** Silnie typowane linki do mediów społecznościowych */
  social_links: SocialLinks;
}

/**
 * Model widoku sportu użytkownika.
 * Rozszerza UserSportDto o nazwę sportu i pomija user_id.
 */
export interface UserSportViewModel extends Omit<UserSportDto, 'user_id'> {
  /** Nazwa sportu */
  name: string;
}

/**
 * Mapuje DTO profilu na model widoku.
 * 
 * @param dto - DTO profilu z API
 * @returns ProfileViewModel z prawidłowo zmapowanymi social_links
 * 
 * @example
 * ```ts
 * const profileDto = await api.getProfile();
 * const viewModel = mapProfileDtoToViewModel(profileDto);
 * ```
 */
const mapProfileDtoToViewModel = (dto: ProfileDto): ProfileViewModel => ({
  ...dto,
  social_links: (dto.social_links as SocialLinks) || {},
});

export interface ProfileViewModel extends ProfileDto {}
export interface UserSportViewModel extends UserSportDto {}

export const useProfileView = () => {
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);
  const [userSports, setUserSports] = useState<UserSportViewModel[]>([]);
  const [allSports, setAllSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await fetch('/api/profiles/me');
        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData: ProfileDto = await profileResponse.json();
        setProfile(mapProfileDtoToViewModel(profileData));

        // Fetch user sports
        const sportsResponse = await fetch('/api/sports');
        if (!sportsResponse.ok) throw new Error('Failed to fetch sports');
        const sportsData: SportDto[] = await sportsResponse.json();
        setAllSports(sportsData);

        // Fetch user sports
        const userSportsResponse = await fetch('/api/profiles/me/sports');
        if (!userSportsResponse.ok) throw new Error('Failed to fetch user sports');
        const userSportsData: UserSportDto[] = await userSportsResponse.json();
        setUserSports(userSportsData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // TODO: Implement proper error handling
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateDisplayName = async (newName: string) => {
    if (!profile) return;
    try {
      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: newName } as UpdateProfileCommand),
      });
      
      if (!response.ok) throw new Error('Failed to update display name');
      const updatedProfile: ProfileDto = await response.json();
      setProfile(mapProfileDtoToViewModel(updatedProfile));
    } catch (error) {
      console.error('Error updating display name:', error);
      // TODO: Implement proper error handling
    }
  };

  const addSocialLink = async (platform: string, url: string) => {
    if (!profile) return;
    try {
      const updatedLinks = {
        ...profile.social_links,
        [platform]: url,
      };

      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_links: updatedLinks } as UpdateProfileCommand),
      });
      
      if (!response.ok) throw new Error('Failed to add social link');
      const updatedProfile: ProfileDto = await response.json();
      setProfile(mapProfileDtoToViewModel(updatedProfile));
    } catch (error) {
      console.error('Error adding social link:', error);
      // TODO: Implement proper error handling
    }
  };

  const editSocialLink = async (platform: string, url: string) => {
    if (!profile) return;
    try {
      const updatedLinks = {
        ...profile.social_links,
        [platform]: url,
      };

      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_links: updatedLinks } as UpdateProfileCommand),
      });
      
      if (!response.ok) throw new Error('Failed to edit social link');
      const updatedProfile: ProfileDto = await response.json();
      setProfile(mapProfileDtoToViewModel(updatedProfile));
    } catch (error) {
      console.error('Error editing social link:', error);
      // TODO: Implement proper error handling
    }
  };

  const deleteSocialLink = async (platform: string) => {
    if (!profile) return;
    try {
      const { [platform]: removed, ...remainingLinks } = profile.social_links;
      
      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social_links: remainingLinks } as UpdateProfileCommand),
      });
      
      if (!response.ok) throw new Error('Failed to delete social link');
      const updatedProfile: ProfileDto = await response.json();
      setProfile(mapProfileDtoToViewModel(updatedProfile));
    } catch (error) {
      console.error('Error deleting social link:', error);
      // TODO: Implement proper error handling
    }
  };

  const addSport = async (data: AddUserSportCommand) => {
    try {
      const response = await fetch('/api/profiles/me/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to add sport');
      const newSport: UserSportDto = await response.json();
      setUserSports(prev => [...prev, newSport]);
    } catch (error) {
      console.error('Error adding sport:', error);
      // TODO: Implement proper error handling
    }
  };

  const editSport = async (sportId: number, data: UpdateUserSportCommand) => {
    try {
      const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to edit sport');
      const updatedSport: UserSportDto = await response.json();
      setUserSports(prev => prev.map(sport => 
        sport.sport_id === sportId ? updatedSport : sport
      ));
    } catch (error) {
      console.error('Error editing sport:', error);
      // TODO: Implement proper error handling
    }
  };

  const deleteSport = async (sportId: number) => {
    try {
      const response = await fetch(`/api/profiles/me/sports/${sportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete sport');
      setUserSports(prev => prev.filter(sport => sport.sport_id !== sportId));
    } catch (error) {
      console.error('Error deleting sport:', error);
      // TODO: Implement proper error handling
    }
  };

  return {
    profile,
    userSports,
    allSports,
    loading,
    updateDisplayName,
    addSocialLink,
    editSocialLink,
    deleteSocialLink,
    addSport,
    editSport,
    deleteSport,
  };
};