/**
 * Main MatchesView component
 * Orchestrates the display of matched users with loading, error, and empty states
 */

import { type FC } from "react";
import { useMatchesView } from "./hooks/useMatchesView";
import { MatchesSkeleton } from "./MatchesSkeleton";
import { MatchesEmptyState } from "./MatchesEmptyState";
import { UserMatchCard } from "./UserMatchCard";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const MatchesView: FC = () => {
  const { matches, isLoading, error, pagination, hasNextPage, loadMore } = useMatchesView();

  // Loading state
  if (isLoading) {
    return <MatchesSkeleton />;
  }

  // Error: No location set
  if (error === "no_location") {
    return (
      <MatchesEmptyState
        variant="no-location"
        title="Brak ustawionej lokalizacji"
        description="Aby zobaczyć dopasowania, musisz najpierw uzupełnić swoją lokalizację w profilu."
        cta={{
          text: "Uzupełnij profil",
          onClick: () => window.location.href = "/profile",
        }}
      />
    );
  }

  // Error: Generic error
  if (error === "generic") {
    return (
      <MatchesEmptyState
        variant="error"
        title="Wystąpił błąd"
        description="Nie udało się pobrać dopasowań. Spróbuj ponownie później."
      />
    );
  }

  // Empty state: No matches
  if (matches.length === 0) {
    return (
      <MatchesEmptyState
        variant="no-matches"
        title="Brak dopasowań"
        description="Nie znaleźliśmy nikogo w Twoim zasięgu. Spróbuj zwiększyć zasięg w swoim profilu lub dodać więcej sportów."
        cta={{
          text: "Edytuj profil",
          onClick: () => window.location.href = "/profile",
        }}
      />
    );
  }

  // Display matches
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Twoje dopasowania</h2>
        {pagination && (
          <p className="text-sm text-muted-foreground">
            Znaleziono {pagination.total} {pagination.total === 1 ? "osobę" : "osób"}
          </p>
        )}
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {matches.map((match) => (
          <UserMatchCard key={match.user_id} match={match} />
        ))}
      </Accordion>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ładowanie...
              </>
            ) : (
              "Załaduj więcej"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
