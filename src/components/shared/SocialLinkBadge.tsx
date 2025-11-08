import { type FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { getPlatformConfig } from "@/lib/config/social-platforms.config";

interface SocialLinkBadgeProps {
  platform: string;
  url: string;
  onEdit?: (platform: string, url: string) => void;
  onDelete?: (platform: string) => void;
}

export const SocialLinkBadge: FC<SocialLinkBadgeProps> = ({
  platform,
  url,
  onEdit,
  onDelete,
}) => {
  const isEditable = Boolean(onEdit && onDelete);
  const config = getPlatformConfig(platform);
  if (!config) return null;

  const { name, icon: Icon } = config;

  const handleEdit = () => {
    if (onEdit) onEdit(platform, url);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(platform);
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm hover:underline"
          >
            {name}
          </a>
        </div>
        {isEditable && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              aria-label={`Edytuj link do ${name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              aria-label={`Usuń link do ${name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};