"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { CurrencyInput } from "@/components/CurrencyInput";
import { DonutChart } from "@/components/DonutChart";
import { DurationInput } from "@/components/DurationInput";
import { InflationForecastPanel } from "@/components/InflationForecastPanel";
import { InflationReferencePanel } from "@/components/InflationReferencePanel";
import { LoanBankOffersPanel } from "@/components/LoanBankOffersPanel";
import { InflationToggle } from "@/components/InflationToggle";
import { LoanForecastPanel } from "@/components/LoanForecastPanel";
import { PaymentScheduleTable } from "@/components/PaymentScheduleTable";
import { PercentInput } from "@/components/PercentInput";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateLoan, type LoanResult, type LoanType } from "@/lib/finance";
import { formatCurrency, formatDateTimeLabel, formatPercent } from "@/lib/formatters";
import type { LoanMarketSnapshot } from "@/lib/loan-market-data";
import { getDefaultInflationRate, getLoanReferenceRate } from "@/lib/reference-data";
import { loanSchema, type LoanFormInput, type LoanFormValues } from "@/lib/validation";

const loanTypeLabels: Record<LoanType, string> = {
  personal: "İhtiyaç Kredisi",
  vehicle: "Taşıt Kredisi",
  mortgage: "Konut Kredisi",
};

const defaultLoanReference = getLoanReferenceRate("personal");

const loanDefaults: LoanFormValues = {
  loanType: "personal",
  principal: 250000,
  months: 36,
  monthlyRate: defaultLoanReference.averageMonthlyRate,
  extraFees: defaultLoanReference.typicalFees,
  includeInflation: false,
  inflationRate: getDefaultInflationRate(),
};

function toLoanResult(values: LoanFormValues) {
  return calculateLoan({
    loanType: values.loanType,
    principal: values.principal,
    months: values.months,
    monthlyRate: values.monthlyRate,
    extraFees: values.extraFees,
    inflation: {
      enabled: values.includeInflation,
      annualRate: values.inflationRate,
    },
  });
}

export function LoanCalculator() {
  const [result, setResult] = useState<LoanResult>(() => toLoanResult(loanDefaults));
  const [submittedValues, setSubmittedValues] = useState<LoanFormValues>(loanDefaults);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loanMarket, setLoanMarket] = useState<LoanMarketSnapshot | null>(null);
  const [loanMarketError, setLoanMarketError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<LoanFormInput, undefined, LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: loanDefaults,
  });
  const loanType = useWatch({ control, name: "loanType" });
  const watchedInflationRate = useWatch({ control, name: "inflationRate" });
  const selectedLoanType = (loanType as LoanType | undefined) ?? loanDefaults.loanType;
  const referenceRate =
    loanMarket?.referenceRates.find((item) => item.loanType === selectedLoanType) ??
    getLoanReferenceRate(selectedLoanType);
  const formInflationRate = Number(watchedInflationRate ?? 0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLoanMarket() {
      try {
        setLoanMarketError(null);
        const response = await fetch("/api/reference/loan-market", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Güncel kredi verisi yüklenemedi.");
        }

        const payload = (await response.json()) as LoanMarketSnapshot;
        setLoanMarket(payload);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoanMarketError(
          error instanceof Error ? error.message : "Güncel kredi verisi yüklenemedi.",
        );
      }
    }

    void loadLoanMarket();

    return () => controller.abort();
  }, []);

  function onSubmit(values: LoanFormValues) {
    setResult(toLoanResult(values));
    setSubmittedValues(values);
  }

  function onClear() {
    reset(loanDefaults);
    setResult(toLoanResult(loanDefaults));
    setSubmittedValues(loanDefaults);
    setShowSchedule(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Kredi planı</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Tabs
              value={loanType}
              onValueChange={(value) =>
                setValue("loanType", value as LoanType, { shouldValidate: true })
              }
            >
              <TabsList aria-label="Kredi tipi">
                {(Object.keys(loanTypeLabels) as LoanType[]).map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {loanTypeLabels[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="rounded-xl border border-border bg-muted px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <p>
                  {referenceRate.label}:{" "}
                  <span className="font-medium text-foreground">
                    {formatPercent(referenceRate.averageMonthlyRate)}
                  </span>
                </p>
                {loanMarket ? (
                  <p>Son güncelleme: {formatDateTimeLabel(loanMarket.generatedAt)}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue("monthlyRate", referenceRate.averageMonthlyRate, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("extraFees", referenceRate.typicalFees, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  Güncel oranı kullan
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {loanMarketError
                  ? loanMarketError
                  : loanMarket?.liveIntegrationStatus ??
                    "Kredi referans verisi kontrol ediliyor. Bağlantı kurulamazsa seed snapshot gösterilir."}
              </p>
            </div>
            <FieldGroup>
              <CurrencyInput
                id="principal"
                label="Kredi tutarı"
                error={errors.principal?.message}
                {...register("principal", { valueAsNumber: true })}
              />
              <DurationInput
                id="months"
                label="Vade"
                unit="ay"
                error={errors.months?.message}
                {...register("months", { valueAsNumber: true })}
              />
              <PercentInput
                id="monthlyRate"
                label="Aylık faiz oranı"
                error={errors.monthlyRate?.message}
                {...register("monthlyRate", { valueAsNumber: true })}
              />
              <CurrencyInput
                id="extraFees"
                label="Masraf / sigorta"
                error={errors.extraFees?.message}
                {...register("extraFees", { valueAsNumber: true })}
              />
              <Controller
                control={control}
                name="includeInflation"
                render={({ field }) => (
                  <InflationToggle
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    preview={
                      <InflationReferencePanel
                        checked={field.value}
                        activeRate={formInflationRate}
                        onApplyPreset={(annualRate) =>
                          setValue("inflationRate", annualRate, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        onEnableAndApply={(annualRate) => {
                          field.onChange(true);
                          setValue("inflationRate", annualRate, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                      />
                    }
                  >
                    <PercentInput
                      id="inflationRate"
                      label="Yıllık enflasyon varsayımı"
                      error={errors.inflationRate?.message}
                      {...register("inflationRate", { valueAsNumber: true })}
                    />
                  </InflationToggle>
                )}
              />
            </FieldGroup>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="sm:flex-1">
                Sonucu göster
              </Button>
              <Button type="button" variant="outline" onClick={onClear}>
                Sıfırla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        <section className="grid min-w-0 gap-4 sm:grid-cols-2">
          <ResultCard label="Aylık ödeme" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Toplam ödeme" value={formatCurrency(result.totalPayment)} />
          <ResultCard
            label="Faiz yükü"
            value={formatCurrency(result.totalInterest)}
            tone="negative"
          />
          <ResultCard
            label="Masraf dahil toplam maliyet"
            value={formatCurrency(result.totalCost)}
          />
          {submittedValues.includeInflation ? (
            <ResultCard
              label="Bugünün parasıyla toplam"
              value={formatCurrency(result.realTotalCost ?? result.totalCost)}
            />
          ) : null}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Toplamın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="loan" />
          </CardContent>
        </Card>

        <LoanBankOffersPanel values={submittedValues} />

        <LoanForecastPanel values={submittedValues} />

        {submittedValues.includeInflation ? (
          <InflationForecastPanel surface="loan" values={submittedValues} />
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <CardTitle>Ay ay ödeme planı</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSchedule((current) => !current)}
              >
                {showSchedule ? "Tabloyu kapat" : "Tabloyu aç"}
              </Button>
            </div>
          </CardHeader>
          {showSchedule ? (
            <CardContent>
              <PaymentScheduleTable data={result.schedule} />
            </CardContent>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
