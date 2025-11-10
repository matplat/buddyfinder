/**
 * Types for MainView component state management and props
 */

import type { GeoJsonPoint } from "@/types";

/**
 * Type of panel that can be displayed
 */
export type PanelType = "profile" | "matches" | "map";

/**
 * State of a single panel
 */
export interface PanelState {
  /** Whether panel is open (mobile: Sheet open, desktop: panel expanded) */
  isOpen: boolean;
  /** Whether panel is collapsed (desktop only: narrow bar visible) */
  isCollapsed: boolean;
}

/**
 * Main view state containing all panels
 */
export interface MainViewState {
  /** Profile panel state */
  profile: PanelState;
  /** Matches panel state */
  matches: PanelState;
  /** Currently active panel on mobile (only one can be open at a time) */
  activeMobilePanel: PanelType | null;
  /** Trigger counter for refreshing matches */
  matchesRefreshTrigger: number;
}

/**
 * Profile data updates that trigger map and matches refresh
 */
export interface ProfileDataUpdates {
  /** New location */
  location?: GeoJsonPoint | null;
  /** New default range in kilometers */
  defaultRangeKm?: number;
  /** Sports were added, removed, or modified */
  sportsChanged?: boolean;
}

/**
 * Location update from MapView
 */
export interface LocationUpdate {
  /** New location */
  location: GeoJsonPoint;
  /** New range in kilometers (optional) */
  rangeKm?: number;
}
