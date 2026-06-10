import { z } from "zod";

const invalidAmountMessage = "Geçerli bir tutar girin.";
const invalidRateMessage = "Geçerli bir oran girin.";

function numberFromInput(emptyValue?: number) {
  return z.preprocess((value) => {
    if (value === "" || (typeof value === "number" && Number.isNaN(value))) {
      return emptyValue;
    }

    return value;
  }, z.number({ error: invalidAmountMessage }).finite(invalidAmountMessage));
}

const nonNegativeAmount = numberFromInput().refine(
  (value) => value >= 0,
  invalidAmountMessage,
);
const positiveAmount = numberFromInput().refine(
  (value) => value > 0,
  invalidAmountMessage,
);
const optionalRate = numberFromInput(0).refine(
  (value) => value >= 0,
  invalidRateMessage,
);
const requiredInflationRate = numberFromInput().refine(
  (value) => value >= 0,
  invalidRateMessage,
);
const positiveYears = numberFromInput().refine(
  (value) => value > 0,
  "Süre 0'dan büyük olmalı.",
);
const positiveMonths = numberFromInput()
  .refine((value) => Number.isInteger(value), "Vade tam ay olarak girilmeli.")
  .refine((value) => value >= 1, "Vade en az 1 ay olmalı.");
const startMonth = numberFromInput()
  .refine((value) => Number.isInteger(value), "Başlangıç ayı seçilmeli.")
  .refine(
    (value) => value >= 1 && value <= 12,
    "Başlangıç ayı seçilmeli.",
  );
const startYear = numberFromInput().refine(
  (value) => Number.isInteger(value) && value >= 2000,
  "Başlangıç yılı geçerli olmalı.",
);
const contributionIncreaseRate = numberFromInput(0).refine(
  (value) => value >= 0,
  "Artış oranı negatif olamaz.",
);

const contributionFields = {
  startMonth,
  startYear,
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
  extraFees: numberFromInput(0).refine(
    (value) => value >= 0,
    invalidAmountMessage,
  ),
  ...inflationFields,
});

export type RegularGrowthFormInput = z.input<typeof regularGrowthSchema>;
export type RegularGrowthFormValues = z.output<typeof regularGrowthSchema>;
export type TargetGrowthFormInput = z.input<typeof targetGrowthSchema>;
export type TargetGrowthFormValues = z.output<typeof targetGrowthSchema>;
export type LoanFormInput = z.input<typeof loanSchema>;
export type LoanFormValues = z.output<typeof loanSchema>;
