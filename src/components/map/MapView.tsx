import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useMapView } from "./hooks/useMapView";
import { InteractiveMap } from "./InteractiveMap";
import { RangeInputPopover } from "./RangeInputPopover";
import { AddressSearch } from "./AddressSearch";
import type { GeoJsonPoint } from "@/types";
import type { LocationUpdate } from "@/components/main/types";
import { Button } from "@/components/ui/button";

export interface MapViewProps {
  /** Callback when location or range is updated */
  onLocationUpdate?: (update: LocationUpdate) => void;
}

/**
 * Main map view component that orchestrates the interactive map and range input.
 * Manages user location and search range settings.
 */
export function MapView({ onLocationUpdate }: MapViewProps) {
  const {
    profile,
    draftLocation,
    draftRangeKm,
    isLoading,
    isSaving,
    error,
    isDirty,
    setDraftLocation,
    setDraftRangeKm,
    saveChanges,
    retry,
  } = useMapView();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [flyToLocation, setFlyToLocation] = useState<GeoJsonPoint | null>(null);
  const [savedLocation, setSavedLocation] = useState<GeoJsonPoint | null>(null);

  // Update saved location when profile loads or after save
  useEffect(() => {
    if (profile?.location) {
      setSavedLocation(profile.location);
    }
  }, [profile]);

  // Handle location change from map click
  const handleLocationChange = useCallback(
    (location: GeoJsonPoint, screenX: number, screenY: number) => {
      setDraftLocation(location);
      setPopoverPos({ x: screenX, y: screenY });
      setIsPopoverOpen(true);
      setFlyToLocation(null); // Clear fly target when clicking
    },
    [setDraftLocation]
  );

  // Handle range change from popover input
  const handleRangeChange = useCallback(
    (rangeKm: number) => {
      setDraftRangeKm(rangeKm);
    },
    [setDraftRangeKm]
  );

  // Handle save button click
  const handleSave = useCallback(async () => {
    try {
      toast.loading("Zapisywanie...", { id: "save-location" });
      await saveChanges();
      toast.success("Ustawienia zostały zapisane", { id: "save-location" });
      // Update saved location after successful save
      if (draftLocation) {
        setSavedLocation(draftLocation);
      }
      setIsPopoverOpen(false);

      // Notify parent component about location update
      if (onLocationUpdate && draftLocation) {
        onLocationUpdate({
          location: draftLocation,
          rangeKm: draftRangeKm,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.";
      toast.error(message, { id: "save-location" });
    }
  }, [saveChanges, draftLocation, onLocationUpdate, draftRangeKm]);

  // Handle address selection from search
  const handleAddressSelect = useCallback((location: GeoJsonPoint, address: string) => {
    // Only fly to location, don't change marker position
    setFlyToLocation(location);
    toast.success(`Znaleziono: ${address}`);
  }, []);

  // Reset fly flag after animation completes
  const handleFlyComplete = useCallback(() => {
    setFlyToLocation(null);
  }, []);

  // Handle cancel - restore saved location
  const handleCancel = useCallback(() => {
    if (savedLocation) {
      setDraftLocation(savedLocation);
    }
    setIsPopoverOpen(false);
  }, [savedLocation, setDraftLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-destructive text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold">Wystąpił błąd</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={retry} variant="default">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // Show map view
  return (
    <div className="relative h-screen w-full">
      {/* Address search bar - positioned at top center */}
      <div className="absolute top-4 left-0 right-0 z-[1000] px-4">
        <AddressSearch onLocationSelect={handleAddressSelect} />
      </div>

      <InteractiveMap
        location={draftLocation}
        rangeKm={draftRangeKm}
        onLocationChange={handleLocationChange}
        isPopoverOpen={isPopoverOpen}
        flyToLocation={flyToLocation}
        onFlyComplete={handleFlyComplete}
      />

      <RangeInputPopover
        isOpen={isPopoverOpen}
        rangeKm={draftRangeKm}
        isDirty={isDirty}
        posX={popoverPos.x}
        posY={popoverPos.y}
        onRangeChange={handleRangeChange}
        onSave={handleSave}
        onClose={handleCancel}
      />
    </div>
  );
}
