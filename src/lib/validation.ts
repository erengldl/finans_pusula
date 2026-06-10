import { z } from "zod";

import { FINANCE_LIMITS } from "@/lib/finance";

const invalidAmountMessage = "Geçerli bir tutar girin.";
const invalidRateMessage = "Geçerli bir oran girin.";

function maxAmountMessage(max: number) {
  return `Tutar en fazla ${new Intl.NumberFormat("tr-TR").format(max)} TL olabilir.`;
}

function maxRateMessage(max: number) {
  return `Oran en fazla %${new Intl.NumberFormat("tr-TR").format(max)} olabilir.`;
}

function maxYearsMessage(max: number) {
  return `Süre en fazla ${max} yıl olabilir.`;
}

function maxMonthsMessage(max: number) {
  return `Vade en fazla ${max} ay olabilir.`;
}

function normalizeEmptyNumber(value: unknown) {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value))
  ) {
    return undefined;
  }

  return value;
}

function amountFromInput() {
  return z.preprocess(
    normalizeEmptyNumber,
    z.number({ error: invalidAmountMessage }).finite(invalidAmountMessage),
  );
}

function rateFromInput() {
  return z.preprocess(
    normalizeEmptyNumber,
    z.number({ error: invalidRateMessage }).finite(invalidRateMessage),
  );
}

const optionalNonNegativeRate = z.preprocess(
  normalizeEmptyNumber,
  z.union([
    z
      .number({ error: invalidRateMessage })
      .finite(invalidRateMessage)
      .refine((value) => value >= 0, invalidRateMessage)
      .refine(
        (value) => value <= FINANCE_LIMITS.rates.annual,
        maxRateMessage(FINANCE_LIMITS.rates.annual),
      ),
    z.undefined(),
  ]),
);

const optionalContributionIncreaseRate = z.preprocess(
  normalizeEmptyNumber,
  z.union([
    z
      .number({ error: invalidRateMessage })
      .finite(invalidRateMessage)
      .refine((value) => value >= 0, "Artış oranı negatif olamaz.")
      .refine(
        (value) => value <= FINANCE_LIMITS.rates.contributionIncrease,
        maxRateMessage(FINANCE_LIMITS.rates.contributionIncrease),
      ),
    z.undefined(),
  ]),
);

const nonNegativeAmount = amountFromInput()
  .refine((value) => value >= 0, invalidAmountMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.currency.max,
    maxAmountMessage(FINANCE_LIMITS.currency.max),
  );
const positiveAmount = amountFromInput()
  .refine((value) => value > 0, invalidAmountMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.currency.max,
    maxAmountMessage(FINANCE_LIMITS.currency.max),
  );
const nonNegativeRate = rateFromInput()
  .refine((value) => value >= 0, invalidRateMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.rates.annual,
    maxRateMessage(FINANCE_LIMITS.rates.annual),
  );
const positiveYears = amountFromInput()
  .refine((value) => value > 0, "Süre 0'dan büyük olmalı.")
  .refine(
    (value) => value <= FINANCE_LIMITS.durations.years,
    maxYearsMessage(FINANCE_LIMITS.durations.years),
  );
const positiveMonths = amountFromInput()
  .refine((value) => Number.isInteger(value), "Vade tam ay olarak girilmeli.")
  .refine((value) => value >= 1, "Vade en az 1 ay olmalı.")
  .refine(
    (value) => value <= FINANCE_LIMITS.durations.loanMonths,
    maxMonthsMessage(FINANCE_LIMITS.durations.loanMonths),
  );
const startMonth = amountFromInput()
  .refine((value) => Number.isInteger(value), "Başlangıç ayı seçilmeli.")
  .refine(
    (value) =>
      value >= FINANCE_LIMITS.calendar.startMonthMin &&
      value <= FINANCE_LIMITS.calendar.startMonthMax,
    "Başlangıç ayı seçilmeli.",
  );
const startYear = amountFromInput()
  .refine(
    (value) => Number.isInteger(value) && value >= FINANCE_LIMITS.calendar.startYearMin,
    "Başlangıç yılı geçerli olmalı.",
  )
  .refine(
    (value) => value <= FINANCE_LIMITS.calendar.startYearMax,
    `Başlangıç yılı en fazla ${FINANCE_LIMITS.calendar.startYearMax} olabilir.`,
  );

const contributionFields = {
  startMonth,
  startYear,
  contributionTiming: z.enum(["beginning", "end"]).default("end"),
  contributionIncreaseType: z.enum([
    "none",
    "annual_february",
    "semiannual_february_july",
  ]),
  contributionIncreaseRate: optionalContributionIncreaseRate,
};

const inflationFields = {
  includeInflation: z.boolean(),
  inflationRate: optionalNonNegativeRate,
};

function validateCalculatorForm<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, context) => {
    if (
      "includeInflation" in data &&
      data.includeInflation &&
      (data.inflationRate === undefined || Number.isNaN(data.inflationRate))
    ) {
      context.addIssue({
        code: "custom",
        path: ["inflationRate"],
        message: "Enflasyon oranı boş bırakılamaz.",
      });
    }

    if (
      "contributionIncreaseType" in data &&
      data.contributionIncreaseType !== "none" &&
      data.contributionIncreaseRate === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["contributionIncreaseRate"],
        message: "Artış oranı boş bırakılamaz.",
      });
    }
  });
}

export const regularGrowthSchema = validateCalculatorForm({
  initialAmount: nonNegativeAmount,
  monthlyContribution: nonNegativeAmount,
  annualRate: nonNegativeRate,
  years: positiveYears,
  ...contributionFields,
  ...inflationFields,
});

export const targetGrowthSchema = validateCalculatorForm({
  targetAmount: positiveAmount,
  currentAmount: nonNegativeAmount,
  monthlyContribution: nonNegativeAmount,
  annualRate: nonNegativeRate,
  ...contributionFields,
  ...inflationFields,
});

export const loanSchema = validateCalculatorForm({
  loanType: z.enum(["personal", "vehicle", "mortgage"]),
  principal: positiveAmount,
  months: positiveMonths,
  monthlyRate: nonNegativeRate,
  extraFees: nonNegativeAmount,
  ...inflationFields,
});

export type RegularGrowthFormInput = z.input<typeof regularGrowthSchema>;
export type RegularGrowthFormValues = z.output<typeof regularGrowthSchema>;
export type TargetGrowthFormInput = z.input<typeof targetGrowthSchema>;
export type TargetGrowthFormValues = z.output<typeof targetGrowthSchema>;
export type LoanFormInput = z.input<typeof loanSchema>;
export type LoanFormValues = z.output<typeof loanSchema>;
