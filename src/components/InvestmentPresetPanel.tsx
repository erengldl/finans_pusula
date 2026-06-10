"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/formatters";
import { investmentReferenceInstruments } from "@/lib/reference-data";
import { cn } from "@/lib/utils";

type InvestmentPresetPanelProps = {
  selectedInstrumentId?: string;
  onApply: (instrumentId: string, annualRate: number) => void;
};

export function InvestmentPresetPanel({
  selectedInstrumentId,
  onApply,
}: InvestmentPresetPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hazır getiri senaryoları</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {investmentReferenceInstruments.map((instrument) => {
          const isActive = selectedInstrumentId === instrument.id;

          return (
            <div
              key={instrument.id}
              className={cn(
                "rounded-lg border border-border bg-background p-4",
                isActive && "border-foreground/15 bg-muted",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{instrument.label}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <p className="text-lg font-semibold text-foreground">
                    {formatPercent(instrument.annualReturnAssumption)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => onApply(instrument.id, instrument.annualReturnAssumption)}
                  >
                    {isActive ? "Seçildi" : "Bu senaryoyu kullan"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
