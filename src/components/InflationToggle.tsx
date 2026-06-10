"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

type InflationToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  preview?: React.ReactNode;
  children?: React.ReactNode;
};

export function InflationToggle({
  checked,
  onCheckedChange,
  preview,
  children,
}: InflationToggleProps) {
  return (
    <Field>
      <div className="flex items-start gap-3 rounded-[18px] border border-border bg-muted p-4">
        <Checkbox
          id="includeInflation"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
          aria-label="Enflasyon etkisini hesaba kat"
        />
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="includeInflation">Sonucu bugünün parasıyla da göster</FieldLabel>
          <FieldDescription>
            Böylece rakamın bugünkü alım gücüyle yaklaşık karşılığını da görebilirsin.
          </FieldDescription>
        </div>
      </div>
      {preview ? <div className="mt-3">{preview}</div> : null}
      {checked ? children : null}
    </Field>
  );
}
