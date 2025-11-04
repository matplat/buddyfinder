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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SportDto, UserSportViewModel } from '@/types';

interface SportEditorDialogProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  allSports: SportDto[];
  sportToEdit?: UserSportViewModel;
  onSave: (data: AddUserSportCommand | UpdateUserSportCommand) => void;
  onClose: () => void;
}

const formSchema = z.object({
  sport_id: z.number().int().positive(),
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), z.string()).optional(),
});

export const SportEditorDialog: FC<SportEditorDialogProps> = ({
  isOpen,
  mode,
  allSports,
  sportToEdit,
  onSave,
  onClose,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === 'edit' && sportToEdit ? {
      sport_id: sportToEdit.sport_id,
      custom_range_km: sportToEdit.custom_range_km,
      parameters: sportToEdit.parameters,
    } : {
      sport_id: undefined,
      custom_range_km: undefined,
      parameters: {},
    },
  });

  const selectedSportId = form.watch('sport_id');
  const selectedSport = allSports.find(s => s.id === selectedSportId);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Dodaj nowy sport' : 'Edytuj sport'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'add' && (
              <FormField
                control={form.control}
                name="sport_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz sport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allSports.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id.toString()}>
                            {sport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="custom_range_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zasięg (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="Domyślny"
                      {...field}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSport?.parameters && Object.entries(selectedSport.parameters).map(([key, schema]) => (
              <FormField
                key={key}
                control={form.control}
                name={`parameters.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{key}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={`Wprowadź ${key.toLowerCase()}`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

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