import { type FC, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SportDto, AddUserSportCommand, UpdateUserSportCommand } from "@/types";
import type { UserSportViewModel } from "@/components/shared/types/sport";
import {
  getSportParametersConfig,
  paceToSeconds,
  secondsToPace,
  timeToMinutes,
  minutesToTime,
  type ParameterConfig,
} from "@/lib/config/sport-parameters.config";

interface SportEditorDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  allSports: SportDto[];
  existingSportIds?: number[];
  sportToEdit?: UserSportViewModel;
  onSave: (data: AddUserSportCommand | UpdateUserSportCommand) => void;
  onClose: () => void;
}

const formSchema = z.object({
  sport_id: z.number().int().positive(),
  custom_range_km: z.number().min(1).max(100).optional(),
  parameters: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const SportEditorDialog: FC<SportEditorDialogProps> = ({
  isOpen,
  mode,
  allSports,
  existingSportIds = [],
  sportToEdit,
  onSave,
  onClose,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "edit" && sportToEdit
        ? {
            sport_id: sportToEdit.sport_id,
            custom_range_km: sportToEdit.custom_range_km ?? undefined,
            parameters: sportToEdit.params as Record<string, string | number>,
          }
        : {
            sport_id: undefined,
            custom_range_km: undefined,
            parameters: {},
          },
  });

  const selectedSportId = form.watch("sport_id");
  const selectedSport = allSports.find((s) => s.id === selectedSportId);
  const currentParameters = form.watch("parameters") || {};
  const sportParametersConfig = selectedSport ? getSportParametersConfig(selectedSport.name) : [];

  // Filtruj dostępne sporty w trybie dodawania (wyklucz te, które użytkownik już ma)
  const availableSports =
    mode === "add" ? allSports.filter((sport) => !existingSportIds.includes(sport.id)) : allSports;

  // Reset parameters when sport changes in add mode
  useEffect(() => {
    if (mode === "add" && selectedSport) {
      form.setValue("parameters", {});
    }
  }, [selectedSportId, mode, selectedSport, form]);

  /**
   * Konwertuje wartość z formatu wyświetlanego do formatu zapisywanego
   */
  const convertToStorageValue = (value: string, paramType: ParameterConfig["type"]): number | string => {
    switch (paramType) {
      case "pace":
        const seconds = paceToSeconds(value);
        return seconds !== null ? seconds : value;
      case "time":
        const minutes = timeToMinutes(value);
        return minutes !== null ? minutes : value;
      case "number":
        return parseFloat(value) || 0;
      case "enum":
      default:
        return value;
    }
  };

  /**
   * Konwertuje wartość z formatu zapisanego do formatu wyświetlanego
   */
  const convertToDisplayValue = (value: string | number, paramType: ParameterConfig["type"]): string => {
    switch (paramType) {
      case "pace":
        return typeof value === "number" ? secondsToPace(value) : String(value);
      case "time":
        return typeof value === "number" ? minutesToTime(value) : String(value);
      default:
        return String(value);
    }
  };

  const handleParameterChange = (paramName: string, value: string, paramConfig: ParameterConfig) => {
    const newParams = { ...currentParameters } as Record<string, string | number>;

    if (value === "") {
      delete newParams[paramName];
    } else {
      newParams[paramName] = convertToStorageValue(value, paramConfig.type);
    }

    form.setValue("parameters", newParams);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Dodaj nowy sport" : "Edytuj sport"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === "add" && (
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
                        {availableSports.map((sport) => (
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
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sportParametersConfig.map((paramConfig) => {
              const currentValue = currentParameters[paramConfig.name];
              const displayValue =
                currentValue !== undefined ? convertToDisplayValue(currentValue, paramConfig.type) : "";

              if (paramConfig.type === "enum") {
                return (
                  <FormItem key={paramConfig.name}>
                    <FormLabel>{paramConfig.label}</FormLabel>
                    <Select
                      value={displayValue}
                      onValueChange={(value) => handleParameterChange(paramConfig.name, value, paramConfig)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={paramConfig.placeholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paramConfig.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }

              return (
                <FormItem key={paramConfig.name}>
                  <FormLabel>
                    {paramConfig.label}
                    {paramConfig.unit && ` (${paramConfig.unit})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type={paramConfig.type === "number" ? "number" : "text"}
                      value={displayValue}
                      onChange={(e) => handleParameterChange(paramConfig.name, e.target.value, paramConfig)}
                      placeholder={paramConfig.placeholder}
                      min={paramConfig.min}
                      max={paramConfig.max}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            })}

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
