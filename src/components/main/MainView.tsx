/**
 * MainView component
 * Main orchestrator that integrates MapView, ProfilePanel, MatchesPanel, and BottomNavigation
 * Manages panel states and synchronizes data between components
 */

import { type FC, useCallback } from "react";
import { MapView } from "@/components/map/MapView";
import { ProfilePanel } from "./ProfilePanel";
import { MatchesPanel } from "./MatchesPanel";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopNavigation } from "./DesktopNavigation";
import { useMainView } from "./hooks/useMainView";
import type { ProfileDataUpdates, LocationUpdate } from "./types";
import { Toaster } from "@/components/ui/sonner";

export const MainView: FC = () => {
  const {
    state,
    isMobile,
    toggleMobilePanel,
    toggleDesktopPanel,
    handleProfileDataChange,
    handleLocationUpdate,
    closeMobilePanel,
  } = useMainView();

  // Wrap handlers with useCallback for stable references
  const onProfileDataChange = useCallback(
    (updates: ProfileDataUpdates) => {
      handleProfileDataChange(updates);
    },
    [handleProfileDataChange]
  );

  const onLocationUpdate = useCallback(
    (update: LocationUpdate) => {
      handleLocationUpdate(update);
    },
    [handleLocationUpdate]
  );

  const onProfileMobileOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeMobilePanel("profile");
      }
    },
    [closeMobilePanel]
  );

  const onMatchesMobileOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeMobilePanel("matches");
      }
    },
    [closeMobilePanel]
  );

  const onProfileDesktopToggle = useCallback(() => {
    toggleDesktopPanel("profile");
  }, [toggleDesktopPanel]);

  const onMatchesDesktopToggle = useCallback(() => {
    toggleDesktopPanel("matches");
  }, [toggleDesktopPanel]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Desktop Navigation (z-40) */}
      <DesktopNavigation />

      {/* Base layer: MapView (z-0) - with top margin on desktop for navbar */}
      <div className="absolute inset-0 md:top-[57px] z-0">
        <MapView onLocationUpdate={onLocationUpdate} />
      </div>

      {/* Profile Panel (z-30) */}
      <ProfilePanel
        panelState={state.profile}
        isMobile={isMobile}
        onDataChange={onProfileDataChange}
        onMobileOpenChange={onProfileMobileOpenChange}
        onDesktopToggle={onProfileDesktopToggle}
      />

      {/* Matches Panel (z-30) */}
      <MatchesPanel
        panelState={state.matches}
        isMobile={isMobile}
        refreshTrigger={state.matchesRefreshTrigger}
        onMobileOpenChange={onMatchesMobileOpenChange}
        onDesktopToggle={onMatchesDesktopToggle}
      />

      {/* Bottom Navigation for mobile (z-50) */}
      <BottomNavigation activePanel={state.activeMobilePanel} onNavigate={toggleMobilePanel} />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};
