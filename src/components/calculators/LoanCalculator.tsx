"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type DefaultValues } from "react-hook-form";

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
import { CalculationEmptyState } from "@/components/calculators/CalculationEmptyState";
import { CalculationSubmitButton } from "@/components/calculators/CalculationSubmitButton";
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
import { optionalNumberField } from "@/lib/form-utils";
import { formatCurrency, formatDateTimeLabel, formatPercent } from "@/lib/formatters";
import type { LoanMarketSnapshot } from "@/lib/loan-market-data";
import { getLoanReferenceRate } from "@/lib/reference-data";
import { loanSchema, type LoanFormInput, type LoanFormValues } from "@/lib/validation";

const loanTypeLabels: Record<LoanType, string> = {
  personal: "İhtiyaç Kredisi",
  vehicle: "Taşıt Kredisi",
  mortgage: "Konut Kredisi",
};

const DEFAULT_LOAN_TYPE: LoanType = "personal";
const defaultLoanReference = getLoanReferenceRate("personal");

const MINIMUM_CALCULATION_DELAY_MS = 300;

const loanDefaults: DefaultValues<LoanFormInput> = {
  loanType: DEFAULT_LOAN_TYPE,
  principal: undefined,
  months: undefined,
  monthlyRate: undefined,
  extraFees: undefined,
  includeInflation: false,
  inflationRate: undefined,
};

const loanResetValues: DefaultValues<LoanFormInput> = {
  ...loanDefaults,
  principal: "",
  months: "",
  monthlyRate: "",
  extraFees: "",
  inflationRate: "",
};

function getCalculationVisibilityLabel(isExample: boolean) {
  return isExample ? "Örnek hesaplama" : "Senin hesaplaman";
}

function getCalculationVisibilityNote(isExample: boolean) {
  return isExample
    ? "Referans aylık oran ve tipik masraf kullanılıyor."
    : "Aylık faiz veya masraf manuel olarak değiştirilmiş.";
}

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
  const [result, setResult] = useState<LoanResult | null>(null);
  const [submittedValues, setSubmittedValues] = useState<LoanFormValues | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loanMarket, setLoanMarket] = useState<LoanMarketSnapshot | null>(null);
  const [loanMarketError, setLoanMarketError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
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
  const selectedLoanType = (loanType as LoanType | undefined) ?? DEFAULT_LOAN_TYPE;
  const referenceRate =
    loanMarket?.referenceRates.find((item) => item.loanType === selectedLoanType) ??
    getLoanReferenceRate(selectedLoanType);
  const formInflationRate = Number(watchedInflationRate ?? 0);
  const submittedReferenceRate = submittedValues
    ? getReferenceRateForType(submittedValues.loanType)
    : defaultLoanReference;
  const isExampleCalculation =
    submittedValues !== null &&
    submittedValues.monthlyRate === submittedReferenceRate.averageMonthlyRate &&
    submittedValues.extraFees === submittedReferenceRate.typicalFees;
  const hasResult = result !== null && submittedValues !== null;

  function getReferenceRateForType(loanTypeToApply: LoanType) {
    return (
      loanMarket?.referenceRates.find((item) => item.loanType === loanTypeToApply) ??
      getLoanReferenceRate(loanTypeToApply)
    );
  }

  function applyReferenceValues(loanTypeToApply: LoanType) {
    const nextReferenceRate = getReferenceRateForType(loanTypeToApply);

    setValue("monthlyRate", nextReferenceRate.averageMonthlyRate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("extraFees", nextReferenceRate.typicalFees, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

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

  async function onSubmit(values: LoanFormValues) {
    setIsCalculating(true);

    try {
      const [nextResult] = await Promise.all([
        Promise.resolve(toLoanResult(values)),
        new Promise((resolve) => setTimeout(resolve, MINIMUM_CALCULATION_DELAY_MS)),
      ]);

      setResult(nextResult);
      setSubmittedValues(values);
    } finally {
      setIsCalculating(false);
    }
  }

  function onClear() {
    reset(loanResetValues);
    setResult(null);
    setSubmittedValues(null);
    setShowSchedule(false);
    setIsCalculating(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Kredi planı</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Tabs
              value={selectedLoanType}
              onValueChange={(value) => {
                const nextLoanType = value as LoanType;

                setValue("loanType", nextLoanType, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
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
                  onClick={() => applyReferenceValues(selectedLoanType)}
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
                placeholder="250.000 TL"
                error={errors.principal?.message}
                {...register("principal", optionalNumberField)}
              />
              <DurationInput
                id="months"
                label="Vade"
                unit="ay"
                placeholder="36"
                error={errors.months?.message}
                {...register("months", optionalNumberField)}
              />
              <PercentInput
                id="monthlyRate"
                label="Aylık faiz oranı"
                placeholder="3,29"
                error={errors.monthlyRate?.message}
                {...register("monthlyRate", optionalNumberField)}
              />
              <CurrencyInput
                id="extraFees"
                label="Masraf / sigorta"
                placeholder="3.500 TL"
                error={errors.extraFees?.message}
                {...register("extraFees", optionalNumberField)}
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
                      placeholder="30"
                      error={errors.inflationRate?.message}
                      {...register("inflationRate", optionalNumberField)}
                    />
                  </InflationToggle>
                )}
              />
            </FieldGroup>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CalculationSubmitButton
                isCalculating={isCalculating}
                className="min-w-[11rem] justify-center sm:flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onClear}
                disabled={isCalculating}
              >
                Sıfırla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        {!hasResult ? <CalculationEmptyState /> : null}
        {hasResult ? (
          <Card className="border-primary/20 bg-secondary/35">
          <CardHeader>
            <CardTitle>{getCalculationVisibilityLabel(isExampleCalculation)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>{getCalculationVisibilityNote(isExampleCalculation)}</p>
            <p>
              Referans oran: {formatPercent(submittedReferenceRate.averageMonthlyRate)} / masraf:{" "}
              {formatCurrency(submittedReferenceRate.typicalFees)}
            </p>
            <p>
              Enflasyon:{" "}
              {submittedValues.includeInflation
                ? `${formatPercent(result.usedAnnualInflationRate ?? 0)} yıllık, ${formatPercent(
                    result.usedMonthlyInflationRate ?? 0,
                  )} aylık`
                : "Kapalı"}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {loanMarket?.liveIntegrationStatus ??
                "Kredi referans verisi kontrol ediliyor. Bağlantı kurulamazsa seed snapshot gösterilir."}
            </p>
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? (
          <section className="grid min-w-0 gap-4 sm:grid-cols-2">
          <ResultCard
            label="Nominal aylık taksit"
            value={formatCurrency(result.nominalMonthlyPayment)}
            helper="Vade boyunca değişmeden hesaplanan taksit."
          />
          <ResultCard
            label="Nominal toplam ödeme"
            value={formatCurrency(result.nominalTotalPayment)}
          />
          <ResultCard
            label="Faiz yükü"
            value={formatCurrency(result.totalInterest)}
            tone="negative"
          />
          <ResultCard
            label="Nominal toplam maliyet"
            value={formatCurrency(result.nominalTotalCost)}
          />
          <ResultCard
            label="Bugünün parasıyla tahmini maliyet"
            value={formatCurrency(result.presentValueTotalCost ?? result.totalCost)}
            helper={
              result.usedAnnualInflationRate === undefined
                ? "Enflasyon kapalı."
                : `Yıllık ${formatPercent(result.usedAnnualInflationRate)} / aylık ${formatPercent(
                    result.usedMonthlyInflationRate ?? 0,
                  )}`
            }
          />
        </section>
        ) : null}

        {hasResult ? (
          <Card>
          <CardHeader>
            <CardTitle>Toplamın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="loan" />
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? <LoanBankOffersPanel values={submittedValues} /> : null}

        {hasResult ? <LoanForecastPanel values={submittedValues} /> : null}

        {hasResult && submittedValues.includeInflation ? (
          <InflationForecastPanel surface="loan" values={submittedValues} />
        ) : null}

        {hasResult ? (
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
        ) : null}
      </div>
    </div>
  );
}
