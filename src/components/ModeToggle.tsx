"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ModeToggleProps = {
  value: "regular" | "target";
  onValueChange: (value: "regular" | "target") => void;
  regularLabel?: string;
};

export function ModeToggle({
  value,
  onValueChange,
  regularLabel = "Düzenli plan",
}: ModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === "regular" || nextValue === "target") {
          onValueChange(nextValue);
        }
      }}
      aria-label="Hesaplama modu"
    >
      <ToggleGroupItem value="regular">{regularLabel}</ToggleGroupItem>
      <ToggleGroupItem value="target">Hedefe ne zaman ulaşırım?</ToggleGroupItem>
    </ToggleGroup>
  );
}
