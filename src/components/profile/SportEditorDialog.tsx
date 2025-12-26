import { type FC, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { SportDto, AddUserSportCommand, UpdateUserSportCommand, SportParameterValue } from "@/types";
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
  sport_id: z
    .number({
      required_error: "Wybierz sport z listy",
      invalid_type_error: "Nieprawidłowy sport",
    })
    .int("Sport musi być liczbą całkowitą")
    .positive("Wybierz sport z listy"),
  custom_range_km: z
    .number({
      invalid_type_error: "Zasięg musi być liczbą",
    })
    .min(1, "Zasięg musi być większy niż 0")
    .max(100, "Zasięg nie może przekraczać 100 km")
    .optional(),
  parameters: z
    .record(
      z.string(),
      z.union([
        z.string(),
        z.number(),
        z.object({
          min: z.number(),
          max: z.number(),
          mode: z.enum(["exact", "range"]),
        }),
      ])
    )
    .optional(),
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
            parameters: sportToEdit.params as Record<string, string | number | SportParameterValue>,
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

  // Reset form when dialog opens with sportToEdit data
  useEffect(() => {
    if (isOpen && mode === "edit" && sportToEdit) {
      form.reset({
        sport_id: sportToEdit.sport_id,
        custom_range_km: sportToEdit.custom_range_km ?? undefined,
        parameters: sportToEdit.params as Record<string, string | number | SportParameterValue>,
      });
    } else if (isOpen && mode === "add") {
      form.reset({
        sport_id: undefined,
        custom_range_km: undefined,
        parameters: {},
      });
    }
  }, [isOpen, mode, sportToEdit, form]);

  /**
   * Konwertuje wartość z formatu wyświetlanego do formatu zapisywanego (liczba)
   */
  const parseInputValue = (value: string, paramType: ParameterConfig["type"]): number | null => {
    switch (paramType) {
      case "pace":
        return paceToSeconds(value);
      case "time":
        return timeToMinutes(value);
      case "number":
        return parseFloat(value);
      default:
        return null;
    }
  };

  /**
   * Konwertuje wartość liczbową do formatu wyświetlanego (string)
   */
  const formatDisplayValue = (value: number, paramType: ParameterConfig["type"]): string => {
    switch (paramType) {
      case "pace":
        return secondsToPace(value);
      case "time":
        return minutesToTime(value);
      default:
        return String(value);
    }
  };

  const handleParameterChange = (
    paramName: string,
    value: string | number | SportParameterValue,
  ) => {
    const baseParams = { ...currentParameters };
    const updatedParams = {
      ...baseParams,
      [paramName]: value,
    };
    form.setValue("parameters", updatedParams);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="sport-editor--dialog">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Dodaj nowy sport" : "Edytuj sport"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="sport-editor--form">
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
                        <SelectTrigger data-testid="sport-editor--sport-select">
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
                      data-testid="sport-editor--custom-range-input"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sportParametersConfig.map((paramConfig) => {
              const rawValue = currentParameters[paramConfig.name];

              if (paramConfig.type === "enum") {
                const displayValue = typeof rawValue === "string" ? rawValue : "";
                return (
                  <FormItem key={paramConfig.name}>
                    <FormLabel>{paramConfig.label}</FormLabel>
                    <Select
                      value={displayValue}
                      onValueChange={(value) => handleParameterChange(paramConfig.name, value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid={`sport-editor--param-${paramConfig.name}`}>
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

              // Numeric types (number, pace, time)
              let mode: "exact" | "range" = "exact";
              let minVal = paramConfig.min || 0;
              let maxVal = paramConfig.min || 0;

              if (typeof rawValue === "object" && rawValue !== null && "mode" in rawValue) {
                mode = rawValue.mode;
                minVal = rawValue.min;
                maxVal = rawValue.max;
              } else if (typeof rawValue === "number") {
                minVal = rawValue;
                maxVal = rawValue;
              }

              const handleModeChange = (checked: boolean) => {
                const newMode = checked ? "range" : "exact";
                // When switching to range, ensure max >= min. If exact, max = min.
                const newMax = checked
                  ? minVal
                  : (minVal + maxVal) / 2;

                handleParameterChange(paramConfig.name, {
                  min: checked ? minVal : (minVal + maxVal) / 2,
                  max: newMax,
                  mode: newMode,
                });
              };

              const handleSliderChange = (value: number[]) => {
                handleParameterChange(paramConfig.name, {
                  min: value[0],
                  max: value[1],
                  mode: "range",
                });
              };

              const handleInputChange = (type: "min" | "max", valueStr: string) => {
                const parsed = parseInputValue(valueStr, paramConfig.type);
                if (parsed === null) return;

                const newMin = type === "min" ? parsed : minVal;
                const newMax = type === "max" ? parsed : maxVal;

                handleParameterChange(paramConfig.name, {
                  min: newMin,
                  max: mode === "exact" ? newMin : newMax,
                  mode: mode,
                });
              };

              return (
                <div key={paramConfig.name} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {paramConfig.label}
                      {paramConfig.unit && ` (${paramConfig.unit})`}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Zakres</span>
                      <Switch
                        checked={mode === "range"}
                        onCheckedChange={handleModeChange}
                        data-testid={`sport-editor--param-${paramConfig.name}-mode-switch`}
                      />
                    </div>
                  </div>

                  {mode === "range" ? (
                    <div className="space-y-4 pt-2">
                      <Slider
                        value={[minVal, maxVal]}
                        min={paramConfig.min}
                        max={paramConfig.max}
                        step={paramConfig.step || 1}
                        onValueChange={handleSliderChange}
                        className="py-2"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={formatDisplayValue(minVal, paramConfig.type)}
                          onChange={(e) => handleInputChange("min", e.target.value)}
                          className="h-8"
                        />
                        <span className="flex items-center text-muted-foreground">-</span>
                        <Input
                          value={formatDisplayValue(maxVal, paramConfig.type)}
                          onChange={(e) => handleInputChange("max", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  ) : (
                    <Input
                      value={formatDisplayValue(minVal, paramConfig.type)}
                      onChange={(e) => handleInputChange("min", e.target.value)}
                      placeholder={paramConfig.placeholder}
                      data-testid={`sport-editor--param-${paramConfig.name}`}
                    />
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose} data-testid="sport-editor--cancel-button">
                Anuluj
              </Button>
              <Button type="submit" data-testid="sport-editor--save-button">
                Zapisz
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
