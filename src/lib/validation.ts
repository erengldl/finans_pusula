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

function numberFromInput(emptyValue?: number) {
  return z.preprocess((value) => {
    if (value === "" || (typeof value === "number" && Number.isNaN(value))) {
      return emptyValue;
    }

    return value;
  }, z.number({ error: invalidAmountMessage }).finite(invalidAmountMessage));
}

const nonNegativeAmount = numberFromInput()
  .refine((value) => value >= 0, invalidAmountMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.currency.max,
    maxAmountMessage(FINANCE_LIMITS.currency.max),
  );
const positiveAmount = numberFromInput()
  .refine((value) => value > 0, invalidAmountMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.currency.max,
    maxAmountMessage(FINANCE_LIMITS.currency.max),
  );
const optionalRate = numberFromInput(0)
  .refine((value) => value >= 0, invalidRateMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.rates.annual,
    maxRateMessage(FINANCE_LIMITS.rates.annual),
  );
const requiredInflationRate = numberFromInput()
  .refine((value) => value >= 0, invalidRateMessage)
  .refine(
    (value) => value <= FINANCE_LIMITS.rates.annual,
    maxRateMessage(FINANCE_LIMITS.rates.annual),
  );
const positiveYears = numberFromInput()
  .refine((value) => value > 0, "Süre 0'dan büyük olmalı.")
  .refine(
    (value) => value <= FINANCE_LIMITS.durations.years,
    maxYearsMessage(FINANCE_LIMITS.durations.years),
  );
const positiveMonths = numberFromInput()
  .refine((value) => Number.isInteger(value), "Vade tam ay olarak girilmeli.")
  .refine((value) => value >= 1, "Vade en az 1 ay olmalı.")
  .refine(
    (value) => value <= FINANCE_LIMITS.durations.loanMonths,
    maxMonthsMessage(FINANCE_LIMITS.durations.loanMonths),
  );
const startMonth = numberFromInput()
  .refine((value) => Number.isInteger(value), "Başlangıç ayı seçilmeli.")
  .refine(
    (value) =>
      value >= FINANCE_LIMITS.calendar.startMonthMin &&
      value <= FINANCE_LIMITS.calendar.startMonthMax,
    "Başlangıç ayı seçilmeli.",
  );
const startYear = numberFromInput()
  .refine(
    (value) => Number.isInteger(value) && value >= FINANCE_LIMITS.calendar.startYearMin,
    "Başlangıç yılı geçerli olmalı.",
  )
  .refine(
    (value) => value <= FINANCE_LIMITS.calendar.startYearMax,
    `Başlangıç yılı en fazla ${FINANCE_LIMITS.calendar.startYearMax} olabilir.`,
  );
const contributionIncreaseRate = numberFromInput(0)
  .refine((value) => value >= 0, "Artış oranı negatif olamaz.")
  .refine(
    (value) => value <= FINANCE_LIMITS.rates.contributionIncrease,
    maxRateMessage(FINANCE_LIMITS.rates.contributionIncrease),
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
  contributionIncreaseRate,
};

const inflationFields = {
  includeInflation: z.boolean(),
  inflationRate: requiredInflationRate.optional(),
};

function validateInflation<T extends z.ZodRawShape>(shape: T) {
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
  });
}

export const regularGrowthSchema = validateInflation({
  initialAmount: nonNegativeAmount,
  monthlyContribution: nonNegativeAmount,
  annualRate: optionalRate,
  years: positiveYears,
  ...contributionFields,
  ...inflationFields,
});

export const targetGrowthSchema = validateInflation({
  targetAmount: positiveAmount,
  currentAmount: nonNegativeAmount,
  monthlyContribution: nonNegativeAmount,
  annualRate: optionalRate,
  ...contributionFields,
  ...inflationFields,
});

export const loanSchema = validateInflation({
  loanType: z.enum(["personal", "vehicle", "mortgage"]),
  principal: positiveAmount,
  months: positiveMonths,
  monthlyRate: optionalRate,
  extraFees: numberFromInput(0)
    .refine((value) => value >= 0, invalidAmountMessage)
    .refine(
      (value) => value <= FINANCE_LIMITS.currency.max,
      maxAmountMessage(FINANCE_LIMITS.currency.max),
    ),
  ...inflationFields,
});

export type RegularGrowthFormInput = z.input<typeof regularGrowthSchema>;
export type RegularGrowthFormValues = z.output<typeof regularGrowthSchema>;
export type TargetGrowthFormInput = z.input<typeof targetGrowthSchema>;
export type TargetGrowthFormValues = z.output<typeof targetGrowthSchema>;
export type LoanFormInput = z.input<typeof loanSchema>;
export type LoanFormValues = z.output<typeof loanSchema>;
