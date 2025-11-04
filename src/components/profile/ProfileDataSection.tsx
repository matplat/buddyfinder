import { type FC } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileViewModel } from './hooks/useProfileView';
import { SocialLinkBadge } from '@/components/shared/SocialLinkBadge';

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
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label 
          htmlFor="display-name" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Nazwa wyświetlana
        </label>
        <Input
          id="display-name"
          type="text"
          value={profile.display_name || ''}
          onChange={(e) => onUpdateDisplayName(e.target.value)}
          placeholder="Wprowadź nazwę wyświetlaną"
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium leading-none">Media społecznościowe</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAddSocialLink()}
          >
            Dodaj link
          </Button>
        </div>

        <div className="grid gap-2">
          {Object.entries(profile.social_links || {}).map(([platform, url]) => (
            <SocialLinkBadge
              key={platform}
              platform={platform}
              url={url}
              onEdit={onEditSocialLink}
              onDelete={onDeleteSocialLink}
            />
          ))}
        </div>
      </div>
    </div>
  );
};