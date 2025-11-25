/**
 * Główny komponent widoku profilu użytkownika.
 *
 * Odpowiada za:
 * - Wyświetlanie i zarządzanie danymi profilu użytkownika
 * - Zarządzanie listą sportów użytkownika
 * - Obsługę wszystkich dialogów do edycji danych
 * - Wyświetlanie powiadomień o sukcesie/błędach
 *
 * Wykorzystuje wzorzec presentational component + custom hook (useProfileView)
 * dla oddzielenia logiki biznesowej od warstwy prezentacji.
 *
 * @example
 * ```tsx
 * // W komponencie strony profilu:
 * import { Layout } from '@/layouts/Layout';
 * import { ProfileView } from '@/components/profile/ProfileView';
 *
 * const ProfilePage = () => {
 *   return (
 *     <Layout>
 *       <ProfileView />
 *     </Layout>
 *   );
 * };
 * ```
 */

import { type FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/sonner";
import { useProfileStore } from "@/components/profile/hooks/useProfileStore";
import { ProfileDataSection } from "@/components/profile/ProfileDataSection";
import { ProfileSportsSection } from "@/components/profile/ProfileSportsSection";
import { SocialMediaEditorDialog } from "@/components/profile/SocialMediaEditorDialog";
import { SocialLinkEditorDialog } from "@/components/profile/SocialLinkEditorDialog";
import { SportEditorDialog } from "@/components/profile/SportEditorDialog";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { ProfileViewSkeleton } from "@/components/profile/ProfileViewSkeleton";
import type { AddUserSportCommand, UpdateUserSportCommand } from "@/lib/dto/user-sport.dto";
import type { UserSportViewModel } from "@/components/shared/types/sport";
import type { ProfileDataUpdates } from "@/components/main/types";

export interface ProfileViewProps {
  /** Callback when profile data changes (location, range, sports) */
  onDataChange?: (updates: ProfileDataUpdates) => void;
}

export const ProfileView: FC<ProfileViewProps> = ({ onDataChange }) => {
  const {
    profile,
    userSports,
    allSports,
    loading,
    updateDisplayName,
    addSocialLink,
    editSocialLink,
    deleteSocialLink,
    addSport,
    editSport,
    deleteSport,
  } = useProfileStore({ onDataChange });

  // Social media dialogs state
  const [isSocialMediaEditorOpen, setIsSocialMediaEditorOpen] = useState(false);
  const [socialLinkToEdit, setSocialLinkToEdit] = useState<{ platform: string; url: string } | null>(null);

  // Sport dialogs state
  const [sportDialogMode, setSportDialogMode] = useState<"add" | "edit">("add");
  const [isSportEditorOpen, setIsSportEditorOpen] = useState(false);
  const [sportToEdit, setSportToEdit] = useState<UserSportViewModel | undefined>();

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => undefined,
  });

  const handleAddSocialLink = () => {
    setIsSocialMediaEditorOpen(true);
  };

  const handleEditSocialLink = (platform: string, url: string) => {
    setSocialLinkToEdit({ platform, url });
  };

  const handleSocialLinkSave = async (platform: string, url: string) => {
    await addSocialLink(platform, url);
    setIsSocialMediaEditorOpen(false);
  };

  const handleSocialLinkEdit = async (platform: string, url: string) => {
    await editSocialLink(platform, url);
    setSocialLinkToEdit(null);
  };

  const handleDeleteSocialLink = (platform: string) => {
    setConfirmationDialog({
      isOpen: true,
      title: "Usuń link",
      description: "Czy na pewno chcesz usunąć ten link do mediów społecznościowych?",
      onConfirm: async () => {
        await deleteSocialLink(platform);
        setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddSport = () => {
    setSportDialogMode("add");
    setSportToEdit(undefined);
    setIsSportEditorOpen(true);
  };

  const handleEditSport = (sport: UserSportViewModel) => {
    setSportDialogMode("edit");
    setSportToEdit(sport);
    setIsSportEditorOpen(true);
  };

  const handleDeleteSport = (sport: UserSportViewModel) => {
    setConfirmationDialog({
      isOpen: true,
      title: "Usuń sport",
      description: `Czy na pewno chcesz usunąć ${sport.sport_name} ze swojego profilu?`,
      onConfirm: async () => {
        await deleteSport(sport.sport_id);
        setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (loading) {
    return <ProfileViewSkeleton />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <Accordion
            type="multiple"
            defaultValue={["profile-data", "profile-sports"]}
            className="w-full"
            data-testid="profile-view--accordion"
          >
            <AccordionItem value="profile-data">
              <AccordionTrigger className="text-lg font-semibold">Dane profilu</AccordionTrigger>
              <AccordionContent className="pt-6">
                <ProfileDataSection
                  profile={profile}
                  onUpdateDisplayName={updateDisplayName}
                  onAddSocialLink={handleAddSocialLink}
                  onEditSocialLink={handleEditSocialLink}
                  onDeleteSocialLink={handleDeleteSocialLink}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="profile-sports" data-testid="profile-view--sports-accordion">
              <AccordionTrigger className="text-lg font-semibold" data-testid="profile-view--sports-accordion-toggle">
                Sporty
              </AccordionTrigger>
              <AccordionContent className="pt-6" data-testid="profile-view--sports-section">
                <ProfileSportsSection
                  userSports={userSports}
                  onAdd={handleAddSport}
                  onEdit={handleEditSport}
                  onDelete={handleDeleteSport}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SocialMediaEditorDialog
        isOpen={isSocialMediaEditorOpen}
        existingPlatforms={profile?.social_links ? Object.keys(profile.social_links) : []}
        onSave={handleSocialLinkSave}
        onClose={() => setIsSocialMediaEditorOpen(false)}
      />

      {socialLinkToEdit && (
        <SocialLinkEditorDialog
          isOpen={!!socialLinkToEdit}
          platform={socialLinkToEdit.platform}
          url={socialLinkToEdit.url}
          onSave={handleSocialLinkEdit}
          onClose={() => setSocialLinkToEdit(null)}
        />
      )}

      <SportEditorDialog
        isOpen={isSportEditorOpen}
        mode={sportDialogMode}
        allSports={allSports}
        existingSportIds={userSports.map((sport) => sport.sport_id)}
        sportToEdit={sportToEdit}
        onSave={async (data) => {
          if (sportDialogMode === "add") {
            await addSport(data as AddUserSportCommand);
          } else if (sportToEdit) {
            await editSport(sportToEdit.sport_id, data as UpdateUserSportCommand);
          }
          setIsSportEditorOpen(false);
        }}
        onClose={() => setIsSportEditorOpen(false)}
      />

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        onConfirm={confirmationDialog.onConfirm}
        onClose={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
      />
      <Toaster />
    </div>
  );
};
