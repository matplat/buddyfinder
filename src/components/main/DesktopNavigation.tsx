/**
 * DesktopNavigation component
 * Top navigation bar visible only on desktop (hidden on mobile)
 */

import { type FC } from "react";
import { Button } from "@/components/ui/button";

export const DesktopNavigation: FC = () => {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        alert("Wystąpił błąd podczas wylogowywania");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Wystąpił błąd podczas wylogowywania");
    }
  };

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 border-b border-border bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="/" className="text-xl font-bold hover:text-primary">
          BuddyFinder
        </a>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Wyloguj
          </Button>
        </div>
      </div>
    </nav>
  );
};
