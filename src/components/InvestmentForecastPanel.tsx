"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCurrency,
  formatDurationFromMonths,
  formatPercent,
} from "@/lib/formatters";
import type { GrowthKind } from "@/lib/finance";
import type { InvestmentForecastResponse } from "@/lib/scenario-engine";
import type {
  RegularGrowthFormValues,
  TargetGrowthFormValues,
} from "@/lib/validation";

type InvestmentForecastPanelProps =
  | {
      kind: GrowthKind;
      mode: "regular";
      values: RegularGrowthFormValues;
      selectedInstrumentId?: string;
    }
  | {
      kind: GrowthKind;
      mode: "target";
      values: TargetGrowthFormValues;
      selectedInstrumentId?: string;
    };

export function InvestmentForecastPanel(props: InvestmentForecastPanelProps) {
  const [data, setData] = useState<InvestmentForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestBody = JSON.stringify(props);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const response = await fetch("/api/forecast/investment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Getiri senaryoları yüklenemedi.");
        }

        const payload = (await response.json()) as InvestmentForecastResponse;
        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Getiri senaryoları yüklenemedi.",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, [requestBody]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getiri senaryoları</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm text-negative">
            {error}
          </p>
        ) : null}

        {data ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {data.scenarios.map((scenario) => (
              <div key={scenario.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-foreground">{scenario.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatPercent(scenario.annualRate)}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {props.mode === "regular" ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Plan sonu toplam</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {formatCurrency(scenario.futureValue ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tahmini getiri</p>
                        <p className="mt-1 text-base font-semibold text-positive">
                          {formatCurrency(scenario.profit ?? 0)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground">Hedefe kalan süre</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatDurationFromMonths(scenario.monthsToTarget ?? null)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam yatırılan</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {formatCurrency(scenario.totalContributions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bugünün parasıyla</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {formatCurrency(
                        props.mode === "regular"
                          ? scenario.realValue ?? scenario.futureValue ?? 0
                          : scenario.realValue ?? scenario.estimatedBalance ?? 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Hazırlanıyor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
