import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RangeInputPopoverProps {
  /** Whether the popover is currently open */
  isOpen: boolean;
  /** Current range value in kilometers */
  rangeKm: number;
  /** Whether any changes have been made */
  isDirty: boolean;
  /** Screen X position where to show the card */
  posX: number;
  /** Screen Y position where to show the card */
  posY: number;
  /** Callback when range value changes */
  onRangeChange: (rangeKm: number) => void;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Callback when close button is clicked */
  onClose: () => void;
}

/**
 * Popover component for editing search range.
 * Appears near the marker when user clicks on the map.
 */
export function RangeInputPopover({
  isOpen,
  rangeKm,
  isDirty,
  posX,
  posY,
  onRangeChange,
  onSave,
  onClose,
}: RangeInputPopoverProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(value)) {
      onRangeChange(value);
    }
  };

  if (!isOpen) return null;

  // Position card near click, with some offset to avoid covering the marker
  const style = {
    position: "fixed" as const,
    left: `${posX + 20}px`,
    top: `${posY - 150}px`,
    zIndex: 1000,
  };

  return (
    <Card className="w-80 shadow-lg" style={style}>
      <CardHeader>
        <CardTitle>Zasięg poszukiwań</CardTitle>
        <CardDescription>
          Określ promień, w jakim chcesz szukać partnerów treningowych.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="range-input">Zasięg (km)</Label>
          <Input
            id="range-input"
            type="number"
            min={1}
            max={100}
            value={rangeKm}
            onChange={handleInputChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Wartość od 1 do 100 km
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSave}
            disabled={!isDirty}
            className="flex-1"
          >
            Zapisz
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Anuluj
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
