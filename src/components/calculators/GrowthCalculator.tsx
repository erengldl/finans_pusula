"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type DefaultValues } from "react-hook-form";

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
import { CalculationEmptyState } from "@/components/calculators/CalculationEmptyState";
import { CalculationSubmitButton } from "@/components/calculators/CalculationSubmitButton";
import {
  calculateRegularGrowth,
  calculateTargetGrowth,
  type ContributionIncreaseType,
  type ContributionTiming,
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
import { optionalNumberField } from "@/lib/form-utils";
import {
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

const contributionTimingOptions: Array<{
  value: ContributionTiming;
  label: string;
}> = [
  { value: "end", label: "Ay sonunda eklensin" },
  { value: "beginning", label: "Ay başında eklensin" },
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

function getContributionTimingLabel(timing: ContributionTiming) {
  return timing === "beginning" ? "Ay başında" : "Ay sonunda";
}

function getScenarioVisibilityLabel(selectedInstrumentId?: string) {
  return selectedInstrumentId ? "Örnek hesaplama" : "Senin hesaplaman";
}

function getScenarioVisibilityNote(selectedInstrumentId?: string) {
  return selectedInstrumentId
    ? "Bir referans enstrüman seçildiği için sonuç örnek veriyle gösteriliyor."
    : "Sonuç doğrudan senin girdiğin oran ve tutarlardan üretiliyor.";
}

function getTargetDurationText(result: TargetGrowthResult) {
  return formatDurationFromMonths(result.monthsToTarget);
}

const MINIMUM_CALCULATION_DELAY_MS = 300;

const regularDefaults: DefaultValues<RegularGrowthFormInput> = {
  initialAmount: undefined,
  monthlyContribution: undefined,
  annualRate: undefined,
  years: undefined,
  startMonth: getDefaultStartMonth(),
  startYear: getDefaultStartYear(),
  contributionTiming: "end",
  contributionIncreaseType: "none",
  contributionIncreaseRate: undefined,
  includeInflation: false,
  inflationRate: undefined,
};

const regularResetValues: DefaultValues<RegularGrowthFormInput> = {
  ...regularDefaults,
  initialAmount: "",
  monthlyContribution: "",
  annualRate: "",
  years: "",
  contributionIncreaseRate: "",
  inflationRate: "",
};

const targetDefaults: DefaultValues<TargetGrowthFormInput> = {
  targetAmount: undefined,
  currentAmount: undefined,
  monthlyContribution: undefined,
  annualRate: undefined,
  startMonth: getDefaultStartMonth(),
  startYear: getDefaultStartYear(),
  contributionTiming: "end",
  contributionIncreaseType: "none",
  contributionIncreaseRate: undefined,
  includeInflation: false,
  inflationRate: undefined,
};

const targetResetValues: DefaultValues<TargetGrowthFormInput> = {
  ...targetDefaults,
  targetAmount: "",
  currentAmount: "",
  monthlyContribution: "",
  annualRate: "",
  contributionIncreaseRate: "",
  inflationRate: "",
};

function toRegularResult(kind: GrowthKind, values: RegularGrowthFormValues) {
  return calculateRegularGrowth(kind, {
    initialAmount: values.initialAmount,
    monthlyContribution: values.monthlyContribution,
    annualRate: values.annualRate,
    years: values.years,
    startMonth: values.startMonth,
    startYear: values.startYear,
    contributionTiming: values.contributionTiming,
    contributionIncreaseType: values.contributionIncreaseType,
    contributionIncreaseRate: values.contributionIncreaseRate ?? 0,
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
    contributionTiming: values.contributionTiming,
    contributionIncreaseType: values.contributionIncreaseType,
    contributionIncreaseRate: values.contributionIncreaseRate ?? 0,
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
  const [result, setResult] = useState<RegularGrowthResult | null>(null);
  const [submittedValues, setSubmittedValues] =
    useState<RegularGrowthFormValues | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
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
  const submittedContributionIncreaseType = submittedValues?.contributionIncreaseType ?? "none";
  const submittedContributionIncreaseRate = submittedValues?.contributionIncreaseRate ?? 0;
  const submittedInstrument = getInvestmentReferenceInstrument(submittedInstrumentId);
  const hasResult = result !== null && submittedValues !== null;

  async function onSubmit(values: RegularGrowthFormValues) {
    const nextSubmittedInstrumentId = selectedInstrumentId;

    setIsCalculating(true);

    try {
      const [nextResult] = await Promise.all([
        Promise.resolve(toRegularResult(kind, values)),
        new Promise((resolve) => setTimeout(resolve, MINIMUM_CALCULATION_DELAY_MS)),
      ]);

      setResult(nextResult);
      setSubmittedValues(values);
      setSubmittedInstrumentId(nextSubmittedInstrumentId);
    } finally {
      setIsCalculating(false);
    }
  }

  function onClear() {
    reset(regularResetValues);
    setResult(null);
    setSubmittedValues(null);
    setSelectedInstrumentId(undefined);
    setSubmittedInstrumentId(undefined);
    setShowDetails(false);
    setIsCalculating(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{config.formTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <input type="hidden" {...register("startYear", optionalNumberField)} />
            <FieldGroup>
              <CurrencyInput
                id="initialAmount"
                label={config.initialLabel}
                placeholder="25.000 TL"
                error={errors.initialAmount?.message}
                {...register("initialAmount", optionalNumberField)}
              />
              <CurrencyInput
                id="monthlyContribution"
                label={config.monthlyLabel}
                error={errors.monthlyContribution?.message}
                placeholder="5.000 TL"
                {...register("monthlyContribution", optionalNumberField)}
              />
              <SelectField
                id="startMonth"
                label="Başlangıç ayı"
                options={monthOptions}
                registration={register("startMonth", { valueAsNumber: true })}
                error={errors.startMonth?.message}
              />
              <SelectField
                id="contributionTiming"
                label="Aylık katkı ne zaman eklensin?"
                options={contributionTimingOptions}
                registration={register("contributionTiming")}
                error={errors.contributionTiming?.message}
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
                  placeholder="10"
                  error={errors.contributionIncreaseRate?.message}
                  {...register("contributionIncreaseRate", optionalNumberField)}
                />
              ) : null}
              <PercentInput
                id="annualRate"
                label={config.rateLabel}
                placeholder="30"
                error={errors.annualRate?.message}
                {...register("annualRate", {
                  ...optionalNumberField,
                  onChange: () => {
                    if (kind === "investment") {
                      setSelectedInstrumentId(undefined);
                    }
                  },
                })}
              />
              <DurationInput
                id="years"
                label="Plan süresi"
                unit="yıl"
                placeholder="5"
                error={errors.years?.message}
                {...register("years", optionalNumberField)}
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
            <CardTitle>{getScenarioVisibilityLabel(submittedInstrumentId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>{getScenarioVisibilityNote(submittedInstrumentId)}</p>
            <p>Katkı zamanı: {getContributionTimingLabel(submittedValues.contributionTiming)}</p>
            <p>
              Aylık katkı modeli:{" "}
              {getContributionModelLabel(
                submittedContributionIncreaseType,
                submittedContributionIncreaseRate,
              )}
            </p>
            <p>
              Enflasyon varsayımı:{" "}
              {submittedValues.includeInflation
                ? formatPercent(submittedValues.inflationRate ?? 0)
                : "Kapalı"}
            </p>
            {submittedInstrument ? (
              <p>Referans enstrüman: {submittedInstrument.label}</p>
            ) : null}
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? (
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
        ) : null}

        {hasResult ? (
          <Card>
          <CardHeader>
            <CardTitle>Paranın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="growth" />
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? (
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
        ) : null}

        {hasResult ? (
          <InvestmentForecastPanel
          kind={kind}
          mode="regular"
          values={submittedValues}
          selectedInstrumentId={submittedInstrumentId}
        />
        ) : null}

        {hasResult && submittedValues.includeInflation ? (
          <InflationForecastPanel
            surface="investment"
            kind={kind}
            mode="regular"
            values={submittedValues}
          />
        ) : null}

        {hasResult ? (
          <MonthlyRoadmap
          rows={result.monthly}
          summary={{
            moduleTitle: config.title,
            targetLabel: "Plan sonu tahmini değer",
            targetValue: result.futureValue,
            currentAmount: submittedValues.initialAmount,
            firstMonthlyContribution: submittedValues.monthlyContribution,
            annualRate: submittedValues.annualRate,
            inflationEnabled: submittedValues.includeInflation,
            inflationRate: submittedValues.inflationRate,
            contributionTimingLabel: getContributionTimingLabel(
              submittedValues.contributionTiming,
            ),
            contributionModel: getContributionModelLabel(
              submittedContributionIncreaseType,
              submittedContributionIncreaseRate,
            ),
            durationLabel: formatDurationFromMonths(result.monthly.length),
            scenarioLabel: getScenarioVisibilityLabel(submittedInstrumentId),
            scenarioDetail: submittedInstrument
              ? `${submittedInstrument.label} referans varsayımı`
              : "Özel girişlerle oluşturulmuş hesaplama.",
            referenceSource: referenceSnapshotMeta.snapshotLabel,
            generatedAtLabel: formatDateTimeLabel(referenceSnapshotMeta.generatedAt),
            disclaimer:
              "Bu PDF yatırım tavsiyesi değildir; seçilen varsayımlara göre üretilir.",
          }}
          isOpen={showDetails}
          onToggle={() => setShowDetails((current) => !current)}
          includeInflation={submittedValues.includeInflation}
          pdfFileName={`${kind}-aylik-birikim-checklisti.pdf`}
        />
        ) : null}
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
  const [result, setResult] = useState<TargetGrowthResult | null>(null);
  const [submittedValues, setSubmittedValues] =
    useState<TargetGrowthFormValues | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
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
  const submittedContributionIncreaseType = submittedValues?.contributionIncreaseType ?? "none";
  const submittedContributionIncreaseRate = submittedValues?.contributionIncreaseRate ?? 0;
  const monthlyContributionLabel =
    kind === "investment" ? "Her ay yatiracagin tutar" : "Her ay ekleyecegin tutar";
  const submittedInstrument = getInvestmentReferenceInstrument(submittedInstrumentId);
  const hasResult = result !== null && submittedValues !== null;

  async function onSubmit(values: TargetGrowthFormValues) {
    const nextSubmittedInstrumentId = selectedInstrumentId;

    setIsCalculating(true);

    try {
      const [nextResult] = await Promise.all([
        Promise.resolve(toTargetResult(kind, values)),
        new Promise((resolve) => setTimeout(resolve, MINIMUM_CALCULATION_DELAY_MS)),
      ]);

      setResult(nextResult);
      setSubmittedValues(values);
      setSubmittedInstrumentId(nextSubmittedInstrumentId);
    } finally {
      setIsCalculating(false);
    }
  }

  function onClear() {
    reset(targetResetValues);
    setResult(null);
    setSubmittedValues(null);
    setSelectedInstrumentId(undefined);
    setSubmittedInstrumentId(undefined);
    setShowDetails(false);
    setIsCalculating(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Hedef planı</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <input type="hidden" {...register("startYear", optionalNumberField)} />
            <FieldGroup>
              <CurrencyInput
                id="targetAmount"
                label="Ulaşmak istediğin tutar"
                placeholder="1.000.000 TL"
                error={errors.targetAmount?.message}
                {...register("targetAmount", optionalNumberField)}
              />
              <CurrencyInput
                id="currentAmount"
                label={configs[kind].targetCurrentLabel}
                placeholder="250.000 TL"
                error={errors.currentAmount?.message}
                {...register("currentAmount", optionalNumberField)}
              />
              <CurrencyInput
                id="monthlyContribution"
                label={monthlyContributionLabel}
                placeholder="5.000 TL"
                error={errors.monthlyContribution?.message}
                {...register("monthlyContribution", optionalNumberField)}
              />
              <SelectField
                id="startMonth"
                label="Başlangıç ayı"
                options={monthOptions}
                registration={register("startMonth", { valueAsNumber: true })}
                error={errors.startMonth?.message}
              />
              <SelectField
                id="contributionTiming"
                label="Aylık katkı ne zaman eklensin?"
                options={contributionTimingOptions}
                registration={register("contributionTiming")}
                error={errors.contributionTiming?.message}
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
                  placeholder="10"
                  error={errors.contributionIncreaseRate?.message}
                  {...register("contributionIncreaseRate", optionalNumberField)}
                />
              ) : null}
              <PercentInput
                id="annualRate"
                label={configs[kind].targetRateLabel}
                placeholder="30"
                error={errors.annualRate?.message}
                {...register("annualRate", {
                  ...optionalNumberField,
                  onChange: () => {
                    if (kind === "investment") {
                      setSelectedInstrumentId(undefined);
                    }
                  },
                })}
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
            <CardTitle>{getScenarioVisibilityLabel(submittedInstrumentId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>{getScenarioVisibilityNote(submittedInstrumentId)}</p>
            <p>Katkı zamanı: {getContributionTimingLabel(submittedValues.contributionTiming)}</p>
            <p>
              Aylık katkı modeli:{" "}
              {getContributionModelLabel(
                submittedContributionIncreaseType,
                submittedContributionIncreaseRate,
              )}
            </p>
            <p>
              Enflasyon varsayımı:{" "}
              {submittedValues.includeInflation
                ? formatPercent(submittedValues.inflationRate ?? 0)
                : "Kapalı"}
            </p>
            {submittedInstrument ? (
              <p>Referans enstrüman: {submittedInstrument.label}</p>
            ) : null}
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? (
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
        ) : null}
        {hasResult && !result.reached ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm leading-6 text-negative">
            {result.failureMessage ??
              "Bu plan mevcut varsayımlarla hedefe yetmiyor. Aylık tutarı, artış oranını veya getiri varsayımını yeniden dene."}
          </p>
        ) : null}
        {hasResult ? (
          <Card>
          <CardHeader>
            <CardTitle>Paranın dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={result.chartData} surface="growth" />
          </CardContent>
        </Card>
        ) : null}

        {hasResult ? (
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
        ) : null}

        {hasResult ? (
          <InvestmentForecastPanel
          kind={kind}
          mode="target"
          values={submittedValues}
          selectedInstrumentId={submittedInstrumentId}
        />
        ) : null}

        {hasResult && submittedValues.includeInflation ? (
          <InflationForecastPanel
            surface="investment"
            kind={kind}
            mode="target"
            values={submittedValues}
          />
        ) : null}

        {hasResult && result.alreadyReached ? (
          <Card>
            <CardHeader>
              <CardTitle>Aylık takip planı gerekmiyor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Bu hedef mevcut birikiminle zaten karşılanıyor. Bu nedenle ek aylık
                takip planı ve PDF oluşturmadık.
              </p>
            </CardContent>
          </Card>
        ) : null}
        {hasResult && !result.alreadyReached ? (
          <MonthlyRoadmap
            rows={result.timeline}
            summary={{
              moduleTitle: "Hedef planı",
              targetLabel: "Bugünün parasıyla hedef",
              targetValue: result.targetToday,
              currentAmount: submittedValues.currentAmount,
              firstMonthlyContribution: submittedValues.monthlyContribution,
              annualRate: submittedValues.annualRate,
              inflationEnabled: submittedValues.includeInflation,
              inflationRate: submittedValues.inflationRate,
              contributionTimingLabel: getContributionTimingLabel(
                submittedValues.contributionTiming,
              ),
              contributionModel: getContributionModelLabel(
                submittedContributionIncreaseType,
                submittedContributionIncreaseRate,
              ),
              durationLabel: getTargetDurationText(result),
              scenarioLabel: getScenarioVisibilityLabel(submittedInstrumentId),
              scenarioDetail: submittedInstrument
                ? `${submittedInstrument.label} referans varsayımı`
                : "Özel girişlerle oluşturulmuş hedef planı.",
              referenceSource: referenceSnapshotMeta.snapshotLabel,
              generatedAtLabel: formatDateTimeLabel(referenceSnapshotMeta.generatedAt),
              disclaimer:
                "Bu PDF yatırım tavsiyesi değildir; hedef süresi seçilen varsayımlara göre değişir.",
            }}
            isOpen={showDetails}
            onToggle={() => setShowDetails((current) => !current)}
            includeInflation={submittedValues.includeInflation}
            pdfFileName={`${kind}-hedef-aylik-birikim-checklisti.pdf`}
            isTargetMode
          />
        ) : null}
      </div>
    </div>
  );
}
