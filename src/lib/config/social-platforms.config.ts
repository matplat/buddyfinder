/**
 * Configuration for social media platforms
 * Defines platform names, icons, and base URLs
 */

import { Instagram, Facebook, GripHorizontal, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlatformConfig {
  name: string;
  icon: LucideIcon;
  baseUrl: string;
}

export const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    baseUrl: "https://www.instagram.com",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    baseUrl: "https://www.facebook.com",
  },
  strava: {
    name: "Strava",
    icon: GripHorizontal,
    baseUrl: "https://www.strava.com",
  },
  garmin: {
    name: "Garmin",
    icon: ExternalLink,
    baseUrl: "https://connect.garmin.com",
  },
} as const;

/**
 * Get platform configuration by platform key
 */
export const getPlatformConfig = (platform: string): PlatformConfig | null => {
  return PLATFORM_CONFIG[platform] || null;
};
