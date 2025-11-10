import { type FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileViewModel } from "./hooks/useProfileView";
import { SocialLinkBadge } from "@/components/shared/SocialLinkBadge";
import { Check, X } from "lucide-react";

interface ProfileDataSectionProps {
  profile: ProfileViewModel;
  onUpdateDisplayName: (newName: string) => void;
  onAddSocialLink: () => void;
  onEditSocialLink: (platform: string, url: string) => void;
  onDeleteSocialLink: (platform: string) => void;
}

export const ProfileDataSection: FC<ProfileDataSectionProps> = ({
  profile,
  onUpdateDisplayName,
  onAddSocialLink,
  onEditSocialLink,
  onDeleteSocialLink,
}) => {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  // Sync local state with profile changes
  useEffect(() => {
    setDisplayName(profile.display_name || "");
  }, [profile.display_name]);

  const hasChanges = displayName !== (profile.display_name || "");

  const handleSaveDisplayName = () => {
    onUpdateDisplayName(displayName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(profile.display_name || "");
    setIsEditingName(false);
  };
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="display-name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Nazwa wyświetlana
        </label>
        <div className="flex gap-2">
          <Input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (!isEditingName) setIsEditingName(true);
            }}
            placeholder="Wprowadź nazwę wyświetlaną"
            className="flex-1"
          />
          {isEditingName && hasChanges && (
            <>
              <Button variant="default" size="icon" onClick={handleSaveDisplayName} aria-label="Zapisz zmiany">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleCancelEdit} aria-label="Anuluj zmiany">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium leading-none">Media społecznościowe</h3>
          <Button variant="outline" size="sm" onClick={() => onAddSocialLink()}>
            Dodaj link
          </Button>
        </div>

        <div className="grid gap-2">
          {Object.entries(profile.social_links || {}).map(([platform, url]) =>
            url ? (
              <SocialLinkBadge
                key={platform}
                platform={platform}
                url={url}
                onEdit={onEditSocialLink}
                onDelete={onDeleteSocialLink}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};
