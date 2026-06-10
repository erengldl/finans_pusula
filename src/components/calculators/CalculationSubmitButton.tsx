import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type CalculationSubmitButtonProps = Omit<ButtonProps, "children" | "type"> & {
  isCalculating: boolean;
};

export function CalculationSubmitButton({
  isCalculating,
  className,
  disabled,
  ...props
}: CalculationSubmitButtonProps) {
  return (
    <>
      <Button
        type="submit"
        className={className}
        disabled={disabled || isCalculating}
        aria-busy={isCalculating}
        {...props}
      >
        {isCalculating ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Hesaplanıyor...
          </>
        ) : (
          "Hesapla"
        )}
      </Button>
      <span className="sr-only" aria-live="polite">
        {isCalculating ? "Hesaplama yapılıyor" : ""}
      </span>
    </>
  );
}
