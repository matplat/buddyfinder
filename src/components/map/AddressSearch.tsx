import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import type { GeoJsonPoint } from "@/types";

interface AddressSearchProps {
  /** Callback when address is selected */
  onLocationSelect: (location: GeoJsonPoint, address: string) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Address search bar component using Nominatim API (OpenStreetMap geocoding)
 */
export function AddressSearch({ onLocationSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, NominatimResult[]>>(new Map());

  // Debounced search with optimizations:
  // - 3 second delay (vs 1.5s) = half the requests
  // - Minimum 3 characters required = prevents accidental searches
  // - Clear results on empty = no unnecessary requests
  useEffect(() => {
    const trimmedQuery = query.trim();
    
    // Clear results if query is empty or too short
    if (trimmedQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddress();
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchAddress = useCallback(async () => {
    const trimmedQuery = query.trim();
    
    // Don't search if query is too short
    if (trimmedQuery.length < 3) {
      return;
    }

    // Check cache first
    const cached = searchCache.get(trimmedQuery.toLowerCase());
    if (cached) {
      setResults(cached);
      setShowResults(true);
      return;
    }

    setIsSearching(true);
    try {
      // Nominatim API - free geocoding by OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: trimmedQuery,
            format: "json",
            addressdetails: "1",
            limit: "5",
            countrycodes: "pl", // Limit to Poland for better results
          })
      );

      if (!response.ok) {
        throw new Error("Nie udało się wyszukać adresu");
      }

      const data: NominatimResult[] = await response.json();
      
      // Cache the results
      setSearchCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(trimmedQuery.toLowerCase(), data);
        // Limit cache size to 20 most recent searches
        if (newCache.size > 20) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) {
            newCache.delete(firstKey);
          }
        }
        return newCache;
      });
      
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Address search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchCache]);

  const handleSelectResult = (result: NominatimResult) => {
    const location: GeoJsonPoint = {
      type: "Point",
      coordinates: [Number.parseFloat(result.lon), Number.parseFloat(result.lat)],
    };
    onLocationSelect(location, result.display_name);
    setQuery(result.display_name);
    setShowResults(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchAddress();
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="bg-background border border-border rounded-lg shadow-lg p-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Wyszukaj adres (min. 3 znaki)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-9 pr-9 bg-background"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0"
            >
              <p className="text-sm font-medium">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowResults(false)}
        />
      )}
    </div>
  );
}
