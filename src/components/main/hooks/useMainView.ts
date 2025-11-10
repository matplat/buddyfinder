/**
 * Custom hook for managing MainView state
 * Handles panel visibility, mobile/desktop transitions, and data synchronization
 */

import { useState, useCallback, useEffect } from "react";
import type { MainViewState, PanelType, ProfileDataUpdates, LocationUpdate } from "../types";

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

/**
 * Initial state for MainView
 */
const getInitialState = (): MainViewState => ({
  profile: {
    isOpen: true, // Open by default on desktop
    isCollapsed: false, // Not collapsed by default on desktop
  },
  matches: {
    isOpen: true, // Open by default on desktop
    isCollapsed: false, // Not collapsed by default on desktop
  },
  activeMobilePanel: null,
  matchesRefreshTrigger: 0,
});

export function useMainView() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  // Initialize state based on viewport
  const [state, setState] = useState<MainViewState>(() => {
    const initialIsMobile = typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;
    if (initialIsMobile) {
      // On mobile, panels are closed by default
      return {
        profile: { isOpen: false, isCollapsed: true },
        matches: { isOpen: false, isCollapsed: true },
        activeMobilePanel: null,
        matchesRefreshTrigger: 0,
      };
    }
    // On desktop, panels are open by default
    return getInitialState();
  });

  // Listen for window resize to detect mobile/desktop switch
  useEffect(() => {
    const handleResize = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;

      if (wasMobile !== nowMobile) {
        setIsMobile(nowMobile);

        // When switching from mobile to desktop, close all sheets
        // and set panels to collapsed state
        if (!nowMobile) {
          setState((prev) => ({
            ...prev,
            activeMobilePanel: null,
            profile: { isOpen: false, isCollapsed: true },
            matches: { isOpen: false, isCollapsed: true },
          }));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  /**
   * Toggle panel on mobile (Sheet open/close)
   */
  const toggleMobilePanel = useCallback((panelType: PanelType) => {
    setState((prev) => {
      // If clicking on map, close all panels
      if (panelType === "map") {
        return {
          ...prev,
          activeMobilePanel: null,
          profile: { ...prev.profile, isOpen: false },
          matches: { ...prev.matches, isOpen: false },
        };
      }

      // If clicking on currently active panel, close it
      if (prev.activeMobilePanel === panelType) {
        return {
          ...prev,
          activeMobilePanel: null,
          [panelType]: { ...prev[panelType], isOpen: false },
        };
      }

      // Open the clicked panel and close others
      return {
        ...prev,
        activeMobilePanel: panelType,
        profile: {
          ...prev.profile,
          isOpen: panelType === "profile",
        },
        matches: {
          ...prev.matches,
          isOpen: panelType === "matches",
        },
      };
    });
  }, []);

  /**
   * Toggle panel collapsed state on desktop
   */
  const toggleDesktopPanel = useCallback((panelType: "profile" | "matches") => {
    setState((prev) => ({
      ...prev,
      [panelType]: {
        ...prev[panelType],
        isCollapsed: !prev[panelType].isCollapsed,
        isOpen: prev[panelType].isCollapsed, // If expanding, set isOpen to true
      },
    }));
  }, []);

  /**
   * Handle profile data changes - triggers matches refresh
   */
  const handleProfileDataChange = useCallback((updates: ProfileDataUpdates) => {
    // Refresh matches if location, range, or sports changed
    if (updates.location !== undefined || updates.defaultRangeKm !== undefined || updates.sportsChanged) {
      setState((prev) => ({
        ...prev,
        matchesRefreshTrigger: prev.matchesRefreshTrigger + 1,
      }));
    }
  }, []);

  /**
   * Handle location update from MapView - triggers matches refresh
   */
  const handleLocationUpdate = useCallback((update: LocationUpdate) => {
    setState((prev) => ({
      ...prev,
      matchesRefreshTrigger: prev.matchesRefreshTrigger + 1,
    }));
  }, []);

  /**
   * Close mobile panel (for Sheet onOpenChange)
   */
  const closeMobilePanel = useCallback((panelType: "profile" | "matches") => {
    setState((prev) => ({
      ...prev,
      activeMobilePanel: prev.activeMobilePanel === panelType ? null : prev.activeMobilePanel,
      [panelType]: {
        ...prev[panelType],
        isOpen: false,
      },
    }));
  }, []);

  return {
    state,
    isMobile,
    toggleMobilePanel,
    toggleDesktopPanel,
    handleProfileDataChange,
    handleLocationUpdate,
    closeMobilePanel,
  };
}
