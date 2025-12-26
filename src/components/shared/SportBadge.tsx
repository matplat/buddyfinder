import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import {
  getSportParametersConfig,
  secondsToPace,
  minutesToTime,
  timeToMinutes,
} from "@/lib/config/sport-parameters.config";
import type { SportParameterValue } from "@/types";

/**
 * Basic sport data structure for display purposes
 * Accepts both 'sport_name' and 'name' for compatibility
 */
export interface SportBadgeData {
  sport_name?: string;
  name?: string;
  custom_range_km?: number | null;
  params?: Record<string, string | number | SportParameterValue>;
  parameters?: Record<string, string | number | SportParameterValue>;
}

interface SportBadgeProps {
  sport: SportBadgeData;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: "default" | "compact";
}

export const SportBadge: FC<SportBadgeProps> = ({ sport, onEdit, onDelete, variant = "default" }) => {
  const isEditable = Boolean(onEdit && onDelete);

  // Get sport name (support both 'sport_name' and 'name')
  const sportName = sport.sport_name || sport.name || "";

  // Get parameters (support both 'params' and 'parameters')
  const sportParams = sport.params || sport.parameters || {};

  // Funkcja pomocnicza do formatowania wartości parametru
  const formatParameterValue = (
    paramName: string,
    value: string | number | SportParameterValue
  ): string => {
    const paramConfig = getSportParametersConfig(sportName).find(
      (p) => p.name === paramName
    );

    // Helper to format a single numeric value based on type
    const formatSingleValue = (val: number) => {
      if (!paramConfig) return String(val);
      switch (paramConfig.type) {
        case "pace":
          return secondsToPace(val);
        case "time":
          return minutesToTime(val);
        default:
          return String(val);
      }
    };

    if (!paramConfig) {
      if (typeof value === "object" && value !== null && "mode" in value) {
        return value.mode === "range"
          ? `${value.min} - ${value.max}`
          : String(value.min);
      }
      return String(value);
    }

    if (typeof value === "object" && value !== null && "mode" in value) {
      if (value.mode === "range") {
        return `${formatSingleValue(value.min)} - ${formatSingleValue(
          value.max
        )} ${paramConfig.unit || ""}`.trim();
      }
      // Exact mode
      return `${formatSingleValue(value.min)} ${paramConfig.unit || ""}`.trim();
    }

    let formattedValue: string;
    if (typeof value === "number") {
      formattedValue = formatSingleValue(value);
    } else {
      formattedValue = String(value);
    }

    return `${formattedValue} ${paramConfig.unit || ""}`.trim();
  };

  // Funkcja pomocnicza do pobierania etykiety parametru
  const getParameterLabel = (paramName: string): string => {
    const paramConfig = getSportParametersConfig(sportName).find((p) => p.name === paramName);
    return paramConfig?.label || paramName;
  };

  // Wariant compact dla użycia w listach dopasowań
  if (variant === "compact") {
    return (
      <div className="border rounded-md p-2 bg-muted/30">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{sportName}</span>
          {Object.keys(sportParams).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(sportParams).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs py-0 h-5">
                  {getParameterLabel(key)}: {formatParameterValue(key, value)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Wariant default dla profilu użytkownika
  return (
    <Card className="relative overflow-hidden" data-testid="sport-card">
      <CardContent className="p-4 pr-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{sportName}</h3>
            {isEditable && (
              <div className="absolute right-4 top-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  aria-label="Edytuj sport"
                  data-testid="edit-sport-button"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  aria-label="Usuń sport"
                  data-testid="delete-sport-button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {sport.custom_range_km && <Badge variant="secondary">Zasięg: {sport.custom_range_km} km</Badge>}
          {Object.keys(sportParams).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(sportParams).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {getParameterLabel(key)}: {formatParameterValue(key, value)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
