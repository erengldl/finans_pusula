import * as React from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type DurationInputProps = React.ComponentProps<typeof Input> & {
  label: string;
  unit: "yıl" | "ay";
  error?: string;
};

export function DurationInput({
  id,
  label,
  unit,
  error,
  className,
  ...props
}: DurationInputProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={unit === "ay" ? 1 : 0}
          step={unit === "ay" ? 1 : 0.5}
          className={className}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {unit}
        </span>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
