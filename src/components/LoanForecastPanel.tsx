"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercent, formatSignedCurrency } from "@/lib/formatters";
import type { LoanFormValues } from "@/lib/validation";
import type { LoanForecastResponse } from "@/lib/scenario-engine";

type LoanForecastPanelProps = {
  values: LoanFormValues;
};

export function LoanForecastPanel({ values }: LoanForecastPanelProps) {
  const [data, setData] = useState<LoanForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestBody = JSON.stringify({ values });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const response = await fetch("/api/forecast/loan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Karşılaştırma senaryoları yüklenemedi.");
        }

        const payload = (await response.json()) as LoanForecastResponse;
        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Karşılaştırma senaryoları yüklenemedi.",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, [requestBody]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faiz senaryoları</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm text-negative">
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              {data.liveIntegrationStatus}
            </p>
            <div className="grid gap-4 xl:grid-cols-3">
              {data.scenarios.map((scenario) => (
                <div key={scenario.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">{scenario.label}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatPercent(scenario.monthlyRate)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Aylık ödeme</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatCurrency(scenario.monthlyPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Toplam maliyet</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatCurrency(scenario.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Faiz yükü</p>
                      <p className="mt-1 text-base font-semibold text-negative">
                        {formatCurrency(scenario.totalInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fark</p>
                      <p
                        className={`mt-1 text-base font-semibold ${
                          scenario.differenceFromBaseline <= 0
                            ? "text-positive"
                            : "text-negative"
                        }`}
                      >
                        {formatSignedCurrency(scenario.differenceFromBaseline)}
                      </p>
                    </div>
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
