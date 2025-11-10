/**
 * Empty state component for MatchesView
 * Displays informative messages when there are no matches or errors occur
 */

import { type FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, AlertCircle } from "lucide-react";

interface MatchesEmptyStateProps {
  title: string;
  description: string;
  cta?: {
    text: string;
    onClick: () => void;
  };
  variant?: "no-location" | "no-matches" | "error";
}

export const MatchesEmptyState: FC<MatchesEmptyStateProps> = ({ title, description, cta, variant = "no-matches" }) => {
  const getIcon = () => {
    switch (variant) {
      case "no-location":
        return <MapPin className="w-12 h-12 text-muted-foreground mb-4" />;
      case "error":
        return <AlertCircle className="w-12 h-12 text-destructive mb-4" />;
      case "no-matches":
      default:
        return <Users className="w-12 h-12 text-muted-foreground mb-4" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center">{getIcon()}</div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        {cta && (
          <CardContent className="flex justify-center pb-6">
            <Button onClick={cta.onClick}>{cta.text}</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
