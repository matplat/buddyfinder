import { type FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { UserSportViewModel } from '@/components/shared/types/sport';
import { getSportParametersConfig, secondsToPace, minutesToTime, timeToMinutes } from '@/lib/sport-parameters-config';

interface SportBadgeProps {
  sport: UserSportViewModel;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SportBadge: FC<SportBadgeProps> = ({
  sport,
  onEdit,
  onDelete,
}) => {
  const isEditable = Boolean(onEdit && onDelete);

  // Funkcja pomocnicza do formatowania wartości parametru
  const formatParameterValue = (paramName: string, value: string | number): string => {
    const paramConfig = getSportParametersConfig(sport.sport_name).find(p => p.name === paramName);
    if (!paramConfig) return String(value);

    let formattedValue: string;
    switch (paramConfig.type) {
      case 'pace':
        formattedValue = typeof value === 'number' ? secondsToPace(value) : String(value);
        break;
      case 'time':
        if (typeof value === 'number') {
          formattedValue = minutesToTime(value);
        } else {
          // Jeśli wartość jest stringiem, spróbuj skonwertować na minuty i sformatować
          const minutes = timeToMinutes(value);
          formattedValue = minutes !== null ? minutesToTime(minutes) : value;
        }
        break;
      case 'number':
        formattedValue = String(value);
        break;
      case 'enum':
      default:
        formattedValue = String(value);
        break;
    }

    return paramConfig.unit ? `${formattedValue} ${paramConfig.unit}` : formattedValue;
  };

  // Funkcja pomocnicza do pobierania etykiety parametru
  const getParameterLabel = (paramName: string): string => {
    const paramConfig = getSportParametersConfig(sport.sport_name).find(p => p.name === paramName);
    return paramConfig?.label || paramName;
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 pr-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{sport.sport_name}</h3>
            {isEditable && (
              <div className="absolute right-4 top-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  aria-label="Edytuj sport"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  aria-label="Usuń sport"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {sport.custom_range_km && (
            <Badge variant="secondary">Zasięg: {sport.custom_range_km} km</Badge>
          )}
          {sport.params && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(sport.params).map(([key, value]) => (
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