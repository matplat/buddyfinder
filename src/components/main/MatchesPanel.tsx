/**
 * MatchesPanel component
 * Adaptive wrapper for MatchesView that renders as:
 * - Sheet (bottom sheet) on mobile
 * - Collapsible side panel on desktop (right side)
 */

import { type FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MatchesView } from "@/components/matches/MatchesView";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { PanelState } from "./types";

export interface MatchesPanelProps {
  /** Current panel state */
  panelState: PanelState;
  /** Whether we're on mobile viewport */
  isMobile: boolean;
  /** Trigger counter for refreshing matches */
  refreshTrigger: number;
  /** Callback when mobile sheet state changes */
  onMobileOpenChange: (isOpen: boolean) => void;
  /** Callback when desktop panel is toggled */
  onDesktopToggle: () => void;
}

const DESKTOP_PANEL_WIDTH = 384; // w-96 = 24rem = 384px
const COLLAPSED_PANEL_WIDTH = 72; // w-18 = 4.5rem = 72px (50% więcej niż 48px)

export const MatchesPanel: FC<MatchesPanelProps> = ({
  panelState,
  isMobile,
  refreshTrigger,
  onMobileOpenChange,
  onDesktopToggle,
}) => {
  // Mobile: Render as Sheet (bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={panelState.isOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto" aria-label="Panel dopasowań">
          <MatchesView refreshTrigger={refreshTrigger} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as side panel with chevron trigger (right side)
  return (
    <aside
      className="hidden md:block fixed right-0 top-[57px] bottom-0 z-30 transition-all duration-300"
      style={{
        width: panelState.isCollapsed ? COLLAPSED_PANEL_WIDTH : DESKTOP_PANEL_WIDTH,
      }}
      aria-label="Panel dopasowań"
      aria-expanded={!panelState.isCollapsed}
    >
      {/* Collapsed state: narrow bar with vertical text only */}
      {panelState.isCollapsed && (
        <div className="h-full bg-background border-l border-border flex flex-col items-center justify-center gap-4">
          <span
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            DOPASOWANIA
          </span>
        </div>
      )}

      {/* Expanded state: full panel with content */}
      {!panelState.isCollapsed && (
        <div className="h-full bg-background border-l border-border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Dopasowania</h2>
          </div>

          {/* Content area with scroll */}
          <div className="flex-1 overflow-y-auto p-4">
            <MatchesView refreshTrigger={refreshTrigger} />
          </div>
        </div>
      )}

      {/* Chevron button - always visible as overlay tab on left edge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDesktopToggle}
        aria-label={panelState.isCollapsed ? "Rozwiń panel dopasowań" : "Zwiń panel dopasowań"}
        className="absolute top-1/2 -translate-y-1/2 -left-4 h-16 w-8 rounded-r-lg rounded-l-none bg-background border border-l-0 border-border hover:bg-accent shadow-md rotate-180"
      >
        {panelState.isCollapsed ? (
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>
    </aside>
  );
};
