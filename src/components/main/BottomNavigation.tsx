/**
 * BottomNavigation component
 * Mobile-only navigation bar with buttons for Profile, Map, and Matches
 * Visible only on mobile devices (< 768px)
 */

import { type FC } from "react";
import { User, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PanelType } from "./types";

export interface BottomNavigationProps {
  /** Currently active panel on mobile */
  activePanel: PanelType | null;
  /** Callback when a navigation button is clicked */
  onNavigate: (panelType: PanelType) => void;
}

export const BottomNavigation: FC<BottomNavigationProps> = ({ activePanel, onNavigate }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50"
      aria-label="Główna nawigacja"
    >
      <div className="flex justify-around items-center h-16 px-4">
        {/* Profile Button */}
        <Button
          variant={activePanel === "profile" ? "default" : "ghost"}
          size="lg"
          onClick={() => onNavigate("profile")}
          className="flex flex-col items-center justify-center h-full gap-1 flex-1"
          aria-label="Profil"
          aria-current={activePanel === "profile" ? "page" : undefined}
        >
          <User className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">Profil</span>
        </Button>

        {/* Map Button */}
        <Button
          variant={activePanel === "map" || activePanel === null ? "default" : "ghost"}
          size="lg"
          onClick={() => onNavigate("map")}
          className="flex flex-col items-center justify-center h-full gap-1 flex-1"
          aria-label="Mapa"
          aria-current={activePanel === "map" || activePanel === null ? "page" : undefined}
        >
          <MapPin className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">Mapa</span>
        </Button>

        {/* Matches Button */}
        <Button
          variant={activePanel === "matches" ? "default" : "ghost"}
          size="lg"
          onClick={() => onNavigate("matches")}
          className="flex flex-col items-center justify-center h-full gap-1 flex-1"
          aria-label="Dopasowania"
          aria-current={activePanel === "matches" ? "page" : undefined}
        >
          <Users className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">Dopasowania</span>
        </Button>
      </div>
    </nav>
  );
};
