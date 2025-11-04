import { type FC } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileViewSkeleton: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <div className="p-6">
          {/* Tabs */}
          <div className="mb-6 grid w-full grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Profile Data Section */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10 w-full" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-8 w-24" />
                </div>
                
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};