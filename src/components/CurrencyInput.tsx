import * as React from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type CurrencyInputProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

export function CurrencyInput({
  id,
  label,
  error,
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          className={className}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          TL
        </span>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
