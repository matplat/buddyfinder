import type { Tables } from "@/db/database.types";

/**
 * Rozszerzamy typ social_links z bazy danych, aby był bardziej precyzyjny
 */
export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  strava?: string;
  garmin?: string;
  [key: string]: string | undefined;
};

/**
 * Profile z typowanymi social_links
 */
export type ProfileViewModel = Omit<Tables<"profiles">, "social_links"> & {
  social_links: SocialLinks;
};

/**
 * Sport użytkownika z nazwą
 */
export type UserSportViewModel = Omit<Tables<"user_sports">, "user_id"> & {
  name: string;
};