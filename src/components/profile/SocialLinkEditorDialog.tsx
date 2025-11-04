import { type FC } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SOCIAL_PLATFORMS = {
  instagram: {
    name: "Instagram",
    baseUrl: "https://www.instagram.com",
  },
  facebook: {
    name: "Facebook",
    baseUrl: "https://www.facebook.com",
  },
  strava: {
    name: "Strava",
    baseUrl: "https://www.strava.com/athletes",
  },
  garmin: {
    name: "Garmin Connect",
    baseUrl: "https://connect.garmin.com/modern/profile",
  },
} as const;

interface SocialLinkEditorDialogProps {
  isOpen: boolean;
  platform: string;
  url: string;
  onSave: (platform: string, newUrl: string) => void;
  onClose: () => void;
}

export const SocialLinkEditorDialog: FC<SocialLinkEditorDialogProps> = ({
  isOpen,
  platform,
  url,
  onSave,
  onClose,
}) => {
  const formSchema = z.object({
    url: z.string().url("Wprowadź poprawny adres URL"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url,
    },
  });

  const platformConfig = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(platform, values.url);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Edytuj link do {platformConfig?.name || platform}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do profilu</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit">Zapisz</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};