/**
 * Loading skeleton component for MatchesView
 * Displays placeholder cards while matches data is being fetched
 */

import { Skeleton } from "@/components/ui/skeleton";

export function MatchesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="border rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
