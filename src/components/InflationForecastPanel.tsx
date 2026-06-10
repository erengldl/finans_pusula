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
import type { InflationForecastResponse } from "@/lib/scenario-engine";
import type {
  LoanFormValues,
  RegularGrowthFormValues,
  TargetGrowthFormValues,
} from "@/lib/validation";

type InflationForecastPanelProps =
  | {
      surface: "loan";
      values: LoanFormValues;
    }
  | {
      surface: "investment";
      kind: GrowthKind;
      mode: "regular";
      values: RegularGrowthFormValues;
    }
  | {
      surface: "investment";
      kind: GrowthKind;
      mode: "target";
      values: TargetGrowthFormValues;
    };

export function InflationForecastPanel(props: InflationForecastPanelProps) {
  const [data, setData] = useState<InflationForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endpoint =
    props.surface === "loan"
      ? "/api/forecast/loan-inflation"
      : "/api/forecast/investment-inflation";
  const requestBody = JSON.stringify(props);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Enflasyon karşılaştırması yüklenemedi.");
        }

        const payload = (await response.json()) as InflationForecastResponse;
        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Enflasyon karşılaştırması yüklenemedi.",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, [endpoint, requestBody]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enflasyon etkisi</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm text-negative">
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">{data.modelSummary}</p>
            <div className="grid gap-4 xl:grid-cols-3">
              {data.scenarios.map((scenario) => (
                <div key={scenario.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{scenario.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{scenario.modelLabel}</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {formatPercent(scenario.inflationRate)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {props.surface === "loan" ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Bugünün parasıyla toplam</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {formatCurrency(scenario.realValue ?? 0)}
                        </p>
                      </div>
                    ) : props.mode === "regular" ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Bugünün parasıyla değer</p>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {formatCurrency(scenario.realValue ?? 0)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Hedefe kalan süre</p>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {formatDurationFromMonths(scenario.monthsToTarget ?? null)}
                          </p>
                        </div>
                      </>
                    )}

                    {scenario.reached !== undefined ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Durum</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {scenario.reached ? "Ulaşılabiliyor" : "Süre uzuyor"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Hazırlanıyor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
