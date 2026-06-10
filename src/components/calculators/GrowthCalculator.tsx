"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { CurrencyInput } from "@/components/CurrencyInput";
import { InflationForecastPanel } from "@/components/InflationForecastPanel";
import { InflationReferencePanel } from "@/components/InflationReferencePanel";
import { DonutChart } from "@/components/DonutChart";
import { DurationInput } from "@/components/DurationInput";
import { InflationToggle } from "@/components/InflationToggle";
import { InvestmentForecastPanel } from "@/components/InvestmentForecastPanel";
import { InvestmentPresetPanel } from "@/components/InvestmentPresetPanel";
import { ModeToggle } from "@/components/ModeToggle";
import { MonthlyRoadmap } from "@/components/MonthlyRoadmap";
import { PercentInput } from "@/components/PercentInput";
import { ResultCard } from "@/components/ResultCard";
import { SelectField } from "@/components/SelectField";
import { SimpleLineChart } from "@/components/SimpleLineChart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import {
  calculateRegularGrowth,
  calculateTargetGrowth,
  type ContributionIncreaseType,
  type GrowthKind,
  type RegularGrowthResult,
  type TargetGrowthResult,
} from "@/lib/finance";
import {
  formatCurrency,
  formatDateTimeLabel,
  formatDurationFromMonths,
  formatPercent,
} from "@/lib/formatters";
import {
  getDefaultInflationRate,
  getInvestmentReferenceInstrument,
  referenceSnapshotMeta,
} from "@/lib/reference-data";
import {
  regularGrowthSchema,
  targetGrowthSchema,
  type RegularGrowthFormInput,
  type RegularGrowthFormValues,
  type TargetGrowthFormInput,
  type TargetGrowthFormValues,
} from "@/lib/validation";

type CalculatorMode = "regular" | "target";

type GrowthCalculatorConfig = {
  title: string;
  regularModeLabel: string;
  formTitle: string;
  resultTitle: string;
  initialLabel: string;
  monthlyLabel: string;
  rateLabel: string;
  targetCurrentLabel: string;
  targetRateLabel: string;
  totalValueLabel: string;
  profitLabel: string;
};

const configs: Record<GrowthKind, GrowthCalculatorConfig> = {
  compound: {
    title: "Faizli birikim",
    regularModeLabel: "Düzenli plan",
    formTitle: "Birikim planı",
    resultTitle: "Birikim sonucu",
    initialLabel: "Başlangıç birikimi",
    monthlyLabel: "Her ay eklenecek tutar",
    rateLabel: "Yıllık getiri oranı",
    targetCurrentLabel: "Bugünkü birikimin",
    targetRateLabel: "Yıllık getiri oranı",
    totalValueLabel: "Plan sonu toplam",
    profitLabel: "Kazanılan getiri",
  },
  simple: {
    title: "Basit faiz",
    regularModeLabel: "Düzenli plan",
    formTitle: "Basit faiz planı",
    resultTitle: "Basit faiz sonucu",
    initialLabel: "Başlangıç birikimi",
    monthlyLabel: "Her ay eklenecek tutar",
    rateLabel: "Yıllık basit faiz oranı",
    targetCurrentLabel: "Bugünkü birikimin",
    targetRateLabel: "Yıllık basit faiz oranı",
    totalValueLabel: "Plan sonu toplam",
    profitLabel: "Kazanılan faiz",
  },
  investment: {
    title: "Yatırım planı",
    regularModeLabel: "Düzenli plan",
    formTitle: "Yatırım planı",
    resultTitle: "Yatırım sonucu",
    initialLabel: "Başlangıç yatırımı",
    monthlyLabel: "Her ay yatırılacak tutar",
    rateLabel: "Yıllık getiri varsayımı",
    targetCurrentLabel: "Bugünkü birikimin",
    targetRateLabel: "Yıllık getiri varsayımı",
    totalValueLabel: "Plan sonu tahmini toplam",
    profitLabel: "Tahmini getiri",
  },
};

const monthOptions = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];

const contributionIncreaseOptions = [
  { value: "none", label: "Hayır, sabit kalsın" },
  { value: "annual_february", label: "Evet, yılda 1 kez artsın" },
  {
    value: "semiannual_february_july",
    label: "Evet, yılda 2 kez artsın",
  },
];

function getDefaultStartMonth() {
  return new Date().getMonth() + 1;
}

function getDefaultStartYear() {
  return new Date().getFullYear();
}

function isIncreaseEnabled(type: ContributionIncreaseType) {
  return type !== "none";
}

function getIncreaseRateLabel(type: ContributionIncreaseType) {
  if (type === "semiannual_february_july") {
    return "Her artışta aylık tutar yüzde kaç artsın?";
  }

  return "Yıllık artışta aylık tutar yüzde kaç artsın?";
}

function getContributionModelLabel(
  type: ContributionIncreaseType,
  rate: number,
) {
  if (type === "annual_february") {
    return `Yılda 1 kez ${formatPercent(rate)} artış`;
  }

  if (type === "semiannual_february_july") {
    return `Yılda 2 kez ${formatPercent(rate)} artış`;
  }

  return "Aylık tutar sabit";
}

function getTargetDurationText(result: TargetGrowthResult) {
  return formatDurationFromMonths(result.monthsToTarget);
}

const regularDefaults: RegularGrowthFormValues = {
  initialAmount: 10000,
  monthlyContribution: 5000,
  annualRate: 30,
  years: 5,
  startMonth: getDefaultStartMonth(),
  startYear: getDefaultStartYear(),
  contributionIncreaseType: "none",
  contributionIncreaseRate: 0,
  includeInflation: false,
  inflationRate: getDefaultInflationRate(),
};

const targetDefaults: TargetGrowthFormValues = {
  targetAmount: 10000000,
  currentAmount: 500000,
  monthlyContribution: 50000,
  annualRate: 30,
  startMonth: getDefaultStartMonth(),
  startYear: getDefaultStartYear(),
  contributionIncreaseType: "none",
  contributionIncreaseRate: 0,
  includeInflation: false,
  inflationRate: getDefaultInflationRate(),
};

function toRegularResult(kind: GrowthKind, values: RegularGrowthFormValues) {
  return calculateRegularGrowth(kind, {
    initialAmount: values.initialAmount,
    monthlyContribution: values.monthlyContribution,
    annualRate: values.annualRate,
    years: values.years,
    startMonth: values.startMonth,
    startYear: values.startYear,
    contributionIncreaseType: values.contributionIncreaseType,
    contributionIncreaseRate: values.contributionIncreaseRate,
    inflation: {
      enabled: values.includeInflation,
      annualRate: values.inflationRate,
    },
  });
}

function toTargetResult(kind: GrowthKind, values: TargetGrowthFormValues) {
  return calculateTargetGrowth(kind, {
    targetAmount: values.targetAmount,
    currentAmount: values.currentAmount,
    monthlyContribution: values.monthlyContribution,
    annualRate: values.annualRate,
    startMonth: values.startMonth,
    startYear: values.startYear,
    contributionIncreaseType: values.contributionIncreaseType,
    contributionIncreaseRate: values.contributionIncreaseRate,
    inflation: {
      enabled: values.includeInflation,
      annualRate: values.inflationRate,
    },
  });
}

export function GrowthCalculator({ kind }: { kind: GrowthKind }) {
  const [mode, setMode] = useState<CalculatorMode>("regular");
  const config = configs[kind];

  return (
    <div className="flex flex-col gap-6">
      <ModeToggle
        value={mode}
        onValueChange={setMode}
        regularLabel={config.regularModeLabel}
      />
      {mode === "regular" ? (
        <RegularGrowthPanel kind={kind} config={config} />
      ) : (
        <TargetGrowthPanel kind={kind} />
      )}
    </div>
  );
}

function RegularGrowthPanel({
  kind,
  config,
}: {
  kind: GrowthKind;
  config: GrowthCalculatorConfig;
}) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | undefined>();
  const [submittedInstrumentId, setSubmittedInstrumentId] = useState<string | undefined>();
  const [result, setResult] = useState<RegularGrowthResult>(() =>
    toRegularResult(kind, regularDefaults),
  );
  const [submittedValues, setSubmittedValues] =
    useState<RegularGrowthFormValues>(regularDefaults);
  const [showDetails, setShowDetails] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegularGrowthFormInput, undefined, RegularGrowthFormValues>({
    resolver: zodResolver(regularGrowthSchema),
    defaultValues: regularDefaults,
  });
  const watchedContributionIncreaseType = useWatch({
    control,
    name: "contributionIncreaseType",
  });
  const watchedInflationRate = useWatch({
    control,
    name: "inflationRate",
  });
  const formContributionIncreaseType =
    watchedContributionIncreaseType as ContributionIncreaseType;
  const formInflationRate = Number(watchedInflationRate ?? 0);
  const submittedContributionIncreaseType = submittedValues.contributionIncreaseType;
  const submittedContributionIncreaseRate = submittedValues.contributionIncreaseRate;
  const submittedInstrument = getInvestmentReferenceInstrument(submittedInstrumentId);

  function onSubmit(values: RegularGrowthFormValues) {
    setResult(toRegularResult(kind, values));
    setSubmittedValues(values);
    setSubmittedInstrumentId(selectedInstrumentId);
  }

  function onClear() {
    reset(regularDefaults);
    setResult(toRegularResult(kind, regularDefaults));
    setSubmittedValues(regularDefaults);
    setSelectedInstrumentId(undefined);
    setSubmittedInstrumentId(undefined);
    setShowDetails(false);
  }

  const regularChecklistSummary = {
    moduleTitle: config.title,
    targetLabel: "Plan sonu tahmini değer",
    targetValue: result.futureValue,
    currentAmount: submittedValues.initialAmount,
    firstMonthlyContribution: submittedValues.monthlyContribution,
    annualRate: submittedValues.annualRate,
    inflationEnabled: submittedValues.includeInflation,
    inflationRate: submittedValues.inflationRate,
    contributionModel: getContributionModelLabel(
      submittedContributionIncreaseType,
      submittedContributionIncreaseRate,
    ),
    durationLabel: formatDurationFromMonths(result.monthly.length),
    scenarioLabel: submittedInstrument
      ? `${submittedInstrument.label} referans varsayımı`
      : "Kullanıcının baz senaryosu",
    referenceSource: referenceSnapshotMeta.snapshotLabel,
    generatedAtLabel: formatDateTimeLabel(referenceSnapshotMeta.generatedAt),
    disclaimer:
      "Bu PDF yatırım tavsiyesi değildir; seçilen varsayımlara göre üretilir.",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{config.formTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <input type="hidden" {...register("startYear", { valueAsNumber: true })} />
            <FieldGroup>
              <CurrencyInput
                id="initialAmount"
                label={config.initialLabel}
                error={errors.initialAmount?.message}
                {...register("initialAmount", { valueAsNumber: true })}
              />
              <CurrencyInput
                id="monthlyContribution"
                label={config.monthlyLabel}
                error={errors.monthlyContribution?.message}
                placeholder="Örn: 20.000 TL"
                {...register("monthlyContribution", { valueAsNumber: true })}
              />
              <SelectField
                id="startMonth"
                label="Başlangıç ayı"
                options={monthOptions}
                registration={register("startMonth", { valueAsNumber: true })}
                error={errors.startMonth?.message}
              />
              <SelectField
                id="contributionIncreaseType"
                label="Aylık tutar zamanla artsın mı?"
                options={contributionIncreaseOptions}
                registration={register("contributionIncreaseType")}
                error={errors.contributionIncreaseType?.message}
              />
              {isIncreaseEnabled(formContributionIncreaseType) ? (
                <PercentInput
                  id="contributionIncreaseRate"
                  label={getIncreaseRateLabel(formContributionIncreaseType)}
                  placeholder={
                    formContributionIncreaseType === "semiannual_february_july"
                      ? "Örn: %15"
                      : "Örn: %30"
                  }
                  error={errors.contributionIncreaseRate?.message}
                  {...register("contributionIncreaseRate", {
                    valueAsNumber: true,
                  })}
                />
              ) : null}
              <PercentInput
                id="annualRate"
                label={config.rateLabel}
                error={errors.annualRate?.message}
                {...register("annualRate", { valueAsNumber: true })}
              />
              <DurationInput
                id="years"
                label="Plan süresi"
                unit="yıl"
                error={errors.years?.message}
                {...register("years", { valueAsNumber: true })}
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
              {kind === "investment" ? (
                <InvestmentPresetPanel
                  selectedInstrumentId={selectedInstrumentId}
                  onApply={(instrumentId, annualRate) => {
                    setSelectedInstrumentId(instrumentId);
                    setValue("annualRate", annualRate, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              ) : null}
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
          <ResultCard
            label={config.totalValueLabel}
            value={formatCurrency(result.futureValue)}
          />
          <ResultCard
            label="Toplam yatırılan para"
            value={formatCurrency(result.totalContributions)}
          />
          <ResultCard
            label={config.profitLabel}
            value={formatCurrency(result.profit)}
            tone={result.profit >= 0 ? "positive" : "negative"}
          />
          {submittedValues.includeInflation ? (
            <ResultCard
              label="Bugünün parasıyla değer"
              value={formatCurrency(result.realValue ?? result.futureValue)}
            />
          ) : null}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Paranın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="growth" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yıllara göre gidişat</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={result.yearly}
              showRealValue={submittedValues.includeInflation}
              showContributions
              primaryLabel={config.totalValueLabel}
              visualTone={kind === "investment" ? "investment" : "growth"}
            />
          </CardContent>
        </Card>

        <InvestmentForecastPanel
          kind={kind}
          mode="regular"
          values={submittedValues}
          selectedInstrumentId={submittedInstrumentId}
        />

        {submittedValues.includeInflation ? (
          <InflationForecastPanel
            surface="investment"
            kind={kind}
            mode="regular"
            values={submittedValues}
          />
        ) : null}

        <MonthlyRoadmap
          rows={result.monthly}
          summary={regularChecklistSummary}
          isOpen={showDetails}
          onToggle={() => setShowDetails((current) => !current)}
          includeInflation={submittedValues.includeInflation}
          pdfFileName={`${kind}-aylik-birikim-checklisti.pdf`}
        />
      </div>
    </div>
  );
}

function TargetGrowthPanel({
  kind,
}: {
  kind: GrowthKind;
}) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | undefined>();
  const [submittedInstrumentId, setSubmittedInstrumentId] = useState<string | undefined>();
  const [result, setResult] = useState<TargetGrowthResult>(() =>
    toTargetResult(kind, targetDefaults),
  );
  const [submittedValues, setSubmittedValues] =
    useState<TargetGrowthFormValues>(targetDefaults);
  const [showDetails, setShowDetails] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TargetGrowthFormInput, undefined, TargetGrowthFormValues>({
    resolver: zodResolver(targetGrowthSchema),
    defaultValues: targetDefaults,
  });
  const watchedContributionIncreaseType = useWatch({
    control,
    name: "contributionIncreaseType",
  });
  const watchedInflationRate = useWatch({
    control,
    name: "inflationRate",
  });
  const formContributionIncreaseType =
    watchedContributionIncreaseType as ContributionIncreaseType;
  const formInflationRate = Number(watchedInflationRate ?? 0);
  const submittedContributionIncreaseType = submittedValues.contributionIncreaseType;
  const submittedContributionIncreaseRate = submittedValues.contributionIncreaseRate;
  const monthlyContributionLabel =
    kind === "investment" ? "Her ay yatiracagin tutar" : "Her ay ekleyecegin tutar";
  const submittedInstrument = getInvestmentReferenceInstrument(submittedInstrumentId);

  function onSubmit(values: TargetGrowthFormValues) {
    setResult(toTargetResult(kind, values));
    setSubmittedValues(values);
    setSubmittedInstrumentId(selectedInstrumentId);
  }

  function onClear() {
    reset(targetDefaults);
    setResult(toTargetResult(kind, targetDefaults));
    setSubmittedValues(targetDefaults);
    setSelectedInstrumentId(undefined);
    setSubmittedInstrumentId(undefined);
    setShowDetails(false);
  }

  const targetChecklistSummary = {
    moduleTitle: "Hedef planı",
    targetLabel: "Bugünün parasıyla hedef",
    targetValue: result.targetToday,
    currentAmount: submittedValues.currentAmount,
    firstMonthlyContribution: submittedValues.monthlyContribution,
    annualRate: submittedValues.annualRate,
    inflationEnabled: submittedValues.includeInflation,
    inflationRate: submittedValues.inflationRate,
    contributionModel: getContributionModelLabel(
      submittedContributionIncreaseType,
      submittedContributionIncreaseRate,
    ),
    durationLabel: getTargetDurationText(result),
    scenarioLabel: submittedInstrument
      ? `${submittedInstrument.label} referans varsayımı`
      : "Kullanıcının baz senaryosu",
    referenceSource: referenceSnapshotMeta.snapshotLabel,
    generatedAtLabel: formatDateTimeLabel(referenceSnapshotMeta.generatedAt),
    disclaimer:
      "Bu PDF yatırım tavsiyesi değildir; hedef süresi seçilen varsayımlara göre değişir.",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Hedef planı</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <input type="hidden" {...register("startYear", { valueAsNumber: true })} />
            <FieldGroup>
              <CurrencyInput
                id="targetAmount"
                label="Ulaşmak istediğin tutar"
                placeholder="Örn: 10.000.000 TL"
                error={errors.targetAmount?.message}
                {...register("targetAmount", { valueAsNumber: true })}
              />
              <CurrencyInput
                id="currentAmount"
                label={configs[kind].targetCurrentLabel}
                error={errors.currentAmount?.message}
                {...register("currentAmount", { valueAsNumber: true })}
              />
              <CurrencyInput
                id="monthlyContribution"
                label={monthlyContributionLabel}
                placeholder="Örn: 20.000 TL"
                error={errors.monthlyContribution?.message}
                {...register("monthlyContribution", { valueAsNumber: true })}
              />
              <SelectField
                id="startMonth"
                label="Başlangıç ayı"
                options={monthOptions}
                registration={register("startMonth", { valueAsNumber: true })}
                error={errors.startMonth?.message}
              />
              <SelectField
                id="contributionIncreaseType"
                label="Aylık tutar zamanla artsın mı?"
                options={contributionIncreaseOptions}
                registration={register("contributionIncreaseType")}
                error={errors.contributionIncreaseType?.message}
              />
              {isIncreaseEnabled(formContributionIncreaseType) ? (
                <PercentInput
                  id="contributionIncreaseRate"
                  label={getIncreaseRateLabel(formContributionIncreaseType)}
                  placeholder={
                    formContributionIncreaseType === "semiannual_february_july"
                      ? "Örn: %15"
                      : "Örn: %30"
                  }
                  error={errors.contributionIncreaseRate?.message}
                  {...register("contributionIncreaseRate", {
                    valueAsNumber: true,
                  })}
                />
              ) : null}
              <PercentInput
                id="annualRate"
                label={configs[kind].targetRateLabel}
                error={errors.annualRate?.message}
                {...register("annualRate", { valueAsNumber: true })}
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
              {kind === "investment" ? (
                <InvestmentPresetPanel
                  selectedInstrumentId={selectedInstrumentId}
                  onApply={(instrumentId, annualRate) => {
                    setSelectedInstrumentId(instrumentId);
                    setValue("annualRate", annualRate, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              ) : null}
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
        <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ResultCard
            label="Hedefe kalan süre"
            value={formatDurationFromMonths(result.monthsToTarget)}
          />
          <ResultCard
            label="Bugünün parasıyla hedef"
            value={formatCurrency(result.targetToday)}
          />
          <ResultCard
            label="Plan sonu tahmini birikim"
            value={formatCurrency(result.estimatedBalance)}
          />
          <ResultCard
            label="Toplam yatırılan para"
            value={formatCurrency(result.totalContributions)}
          />
          <ResultCard
            label={kind === "investment" ? "Tahmini getiri" : "Tahmini kazanç"}
            value={formatCurrency(result.estimatedProfit)}
            tone={result.estimatedProfit >= 0 ? "positive" : "negative"}
          />
          <ResultCard
            label="Son aylık tutar"
            value={formatCurrency(result.finalMonthlyContribution)}
          />
        </section>
        {!result.reached ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm leading-6 text-negative">
            Bu plan mevcut varsayımlarla hedefe yetmiyor. Aylık tutarı, artış oranını
            veya getiri varsayımını yeniden denemeyi düşün.
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Paranın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="growth" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hedefe yaklaşma çizgisi</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={result.timeline}
              showTarget
              primaryLabel="Tahmini birikim"
              targetLabel={
                submittedValues.includeInflation
                  ? "Enflasyonla büyüyen hedef"
                  : "Hedef tutar"
              }
              visualTone={kind === "investment" ? "investment" : "growth"}
              xAxisKey="month"
            />
          </CardContent>
        </Card>

        <InvestmentForecastPanel
          kind={kind}
          mode="target"
          values={submittedValues}
          selectedInstrumentId={submittedInstrumentId}
        />

        {submittedValues.includeInflation ? (
          <InflationForecastPanel
            surface="investment"
            kind={kind}
            mode="target"
            values={submittedValues}
          />
        ) : null}

        <MonthlyRoadmap
          rows={result.timeline}
          summary={targetChecklistSummary}
          isOpen={showDetails}
          onToggle={() => setShowDetails((current) => !current)}
          includeInflation={submittedValues.includeInflation}
          pdfFileName={`${kind}-hedef-aylik-birikim-checklisti.pdf`}
          isTargetMode
        />
      </div>
    </div>
  );
}
