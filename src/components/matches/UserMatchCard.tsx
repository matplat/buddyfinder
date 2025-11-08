/**
 * Card component for displaying a single matched user
 * Uses Accordion for expandable content
 */

import { type FC } from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MapPin, Mail } from "lucide-react";
import type { UserMatchViewModel } from "./types";
import { getPlatformConfig } from "@/lib/config/social-platforms.config";
import { SportBadge } from "@/components/shared/SportBadge";

interface UserMatchCardProps {
  match: UserMatchViewModel;
}

export const UserMatchCard: FC<UserMatchCardProps> = ({ match }) => {
  return (
    <AccordionItem value={match.user_id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex flex-col items-start gap-1">
            <span className="font-semibold text-lg">{match.display_name}</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{match.distance_km.toFixed(1)} km</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-4">
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${match.email}`}
              className="text-primary hover:underline"
            >
              {match.email}
            </a>
          </div>

          {/* Sports */}
          {match.sports.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Sporty</h4>
              <div className="space-y-2">
                {match.sports.map((sport) => (
                  <SportBadge
                    key={sport.sport_id}
                    sport={{
                      sport_name: sport.name,
                      params: sport.parameters,
                    }}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {Object.keys(match.social_links).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Media społecznościowe</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(match.social_links).map(([platform, url]) => {
                  const config = getPlatformConfig(platform);
                  if (!config) return null;

                  const Icon = config.icon;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs hover:bg-muted transition-colors"
                      aria-label={`Link do ${config.name}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{config.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
