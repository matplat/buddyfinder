import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import type { GeoJsonPoint } from "@/types";
import { useEffect } from "react";

// Custom marker icon with primary color
const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-marker-icon",
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" 
          fill="oklch(0.6744 0.1785 42.7042)"
          stroke="oklch(1.0000 0 0)"
          stroke-width="1.5"
        />
        <circle cx="12.5" cy="12.5" r="5" fill="oklch(1.0000 0 0)" />
      </svg>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

interface InteractiveMapProps {
  /** Current location to display marker at */
  location: GeoJsonPoint | null;
  /** Range in kilometers to display as a circle */
  rangeKm: number;
  /** Callback when user clicks on the map */
  onLocationChange: (location: GeoJsonPoint, screenX: number, screenY: number) => void;
  /** Whether the popover is currently open */
  isPopoverOpen: boolean;
  /** Location to fly to (from address search) - doesn't move marker */
  flyToLocation?: GeoJsonPoint | null;
  /** Callback when fly animation completes */
  onFlyComplete?: () => void;
}

// Default center: Warsaw, Poland
const DEFAULT_CENTER: LatLngExpression = [52.2297, 21.0122];
const DEFAULT_ZOOM = 7;

/**
 * Component that handles map click events
 */
function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (location: GeoJsonPoint, screenX: number, screenY: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      const { x, y } = e.containerPoint; // Get screen coordinates
      const geoJsonPoint: GeoJsonPoint = {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON uses [longitude, latitude] order
      };
      onLocationChange(geoJsonPoint, x, y);
    },
  });

  return null;
}

/**
 * Component that handles flying to a location
 */
function FlyToLocation({ location, onComplete }: { location: LatLngExpression | null; onComplete?: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo(location, 13, {
        duration: 1.5,
      });
      // Call onComplete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [location, map, onComplete]);

  return null;
}

/**
 * Interactive map component using react-leaflet with OpenStreetMap tiles.
 * Displays a marker at the user's location and a semi-transparent circle representing the search range.
 */
export function InteractiveMap({
  location,
  rangeKm,
  onLocationChange,
  isPopoverOpen,
  flyToLocation = null,
  onFlyComplete,
}: InteractiveMapProps) {
  // Convert GeoJSON Point to Leaflet LatLngExpression
  const markerPosition: LatLngExpression | null = location
    ? [location.coordinates[1], location.coordinates[0]] // Leaflet uses [latitude, longitude]
    : null;

  // Convert flyToLocation GeoJSON Point to Leaflet LatLngExpression
  const flyToPosition: LatLngExpression | null = flyToLocation
    ? [flyToLocation.coordinates[1], flyToLocation.coordinates[0]]
    : null;

  // Use location as center if available, otherwise use default (Warsaw)
  const mapCenter: LatLngExpression = markerPosition || DEFAULT_CENTER;

  return (
    <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }} className="z-0">
      {/* OpenStreetMap tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map click handler */}
      <MapClickHandler onLocationChange={onLocationChange} />

      {/* Fly to location when address is selected */}
      <FlyToLocation location={flyToPosition} onComplete={onFlyComplete} />

      {/* Marker and circle - only show if location is set */}
      {markerPosition && (
        <>
          <Marker position={markerPosition} icon={createCustomIcon()} />
          <Circle
            center={markerPosition}
            radius={rangeKm * 1000} // Convert km to meters
            pathOptions={{
              color: "oklch(0.6744 0.1785 42.7042)", // Primary color from theme
              fillColor: "oklch(0.6744 0.1785 42.7042)", // Primary color from theme
              fillOpacity: 0.15, // Semi-transparent fill
              weight: 2, // Border width
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
