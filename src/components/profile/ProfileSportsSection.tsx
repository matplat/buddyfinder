import { type FC } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { UserSportViewModel } from '@/components/shared/types/sport';
import { SportBadge } from '@/components/shared/SportBadge';

interface ProfileSportsSectionProps {
  userSports: UserSportViewModel[];
  onAdd: () => void;
  onEdit: (sport: UserSportViewModel) => void;
  onDelete: (sport: UserSportViewModel) => void;
}

export const ProfileSportsSection: FC<ProfileSportsSectionProps> = ({
  userSports,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Twoje sporty</h3>
        <Button 
          onClick={onAdd}
          className="inline-flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Dodaj sport
        </Button>
      </div>

      {userSports.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h4 className="text-sm font-medium text-muted-foreground">
            Nie masz jeszcze żadnych sportów
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Kliknij "Dodaj sport" aby rozpocząć.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {userSports.map((sport) => (
            <SportBadge
              key={sport.sport_id}
              sport={sport}
              onEdit={() => onEdit(sport)}
              onDelete={() => onDelete(sport)}
            />
          ))}
        </div>
      )}
    </div>
  );
};