"use client";

import { Button } from "@/components/ui/button";
import { formatDateTimeLabel, formatPercent } from "@/lib/formatters";
import {
  getInflationModelCatalog,
  getInflationReferenceHeadline,
  turkeyInflationSnapshot,
} from "@/lib/inflation-engine";
import {
  inflationReferencePresets,
  referenceSnapshotMeta,
} from "@/lib/reference-data";
import { cn } from "@/lib/utils";

type InflationReferencePanelProps = {
  checked: boolean;
  activeRate?: number;
  onApplyPreset: (annualRate: number) => void;
  onEnableAndApply: (annualRate: number) => void;
};

export function InflationReferencePanel({
  checked,
  activeRate,
  onApplyPreset,
  onEnableAndApply,
}: InflationReferencePanelProps) {
  const inflationModels = getInflationModelCatalog();

  return (
    <div className="rounded-[18px] border border-border bg-muted p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Türkiye enflasyon modelleri</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {getInflationReferenceHeadline()}. Son model güncellemesi:{" "}
          {formatDateTimeLabel(referenceSnapshotMeta.generatedAt)}.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {inflationReferencePresets.map((preset) => {
          const isActive = activeRate === preset.annualRate;

          return (
            <div
              key={preset.id}
              className={cn(
                "rounded-lg border border-border bg-background p-4",
                isActive && "border-foreground/15 bg-card",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{preset.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {preset.description}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {preset.modelLabel} · {preset.formulaLabel}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {preset.sourceLabel}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <p className="text-lg font-semibold text-foreground">
                    {formatPercent(preset.annualRate)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() =>
                      checked
                        ? onApplyPreset(preset.annualRate)
                        : onEnableAndApply(preset.annualRate)
                    }
                  >
                    {checked ? (isActive ? "Uygulandı" : "Preseti uygula") : "Aç ve uygula"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-4 rounded-lg border border-border bg-background p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
          Hangi model nasıl hesaplanıyor?
        </summary>
        <div className="mt-4 grid gap-3">
          {inflationModels.map((model) => (
            <div key={model.id} className="rounded-lg border border-border bg-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{model.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {model.formulaLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatPercent(model.annualRate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aylık eşdeğer: {formatPercent(model.monthlyEquivalentRate)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {model.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Çekirdek B göstergesi aynı snapshot içinde yıllık %{turkeyInflationSnapshot.coreBAnnualRate.toFixed(2).replace(".", ",")} seviyesindedir. Bu alan sonraki adımda kişisel sepet ve alt kalem tabanlı modellere bağlanabilir.
        </p>
      </details>
    </div>
  );
}
