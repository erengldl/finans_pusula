import type { UseFormRegisterReturn } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type SelectFieldProps = {
  id: string;
  label: string;
  options: Array<{ value: string | number; label: string }>;
  registration: UseFormRegisterReturn;
  error?: string;
  className?: string;
};

export function SelectField({
  id,
  label,
  options,
  registration,
  error,
  className,
}: SelectFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-negative aria-invalid:ring-negative/20",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...registration}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
