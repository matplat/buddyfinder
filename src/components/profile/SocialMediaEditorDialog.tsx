import { type FC } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const formSchema = z.object({
  platform: z.enum(["instagram", "facebook", "strava", "garmin"] as const),
  url: z.string().url("Wprowadź poprawny adres URL"),
});

interface SocialMediaEditorDialogProps {
  isOpen: boolean;
  onSave: (platform: string, url: string) => void;
  onClose: () => void;
}

export const SocialMediaEditorDialog: FC<SocialMediaEditorDialogProps> = ({
  isOpen,
  onSave,
  onClose,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: "instagram",
      url: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values.platform, values.url);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj link do mediów społecznościowych</DialogTitle>
          <DialogDescription>
            Wybierz platformę i podaj link do swojego profilu.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platforma</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz platformę" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SOCIAL_PLATFORMS).map(([key, { name }]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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