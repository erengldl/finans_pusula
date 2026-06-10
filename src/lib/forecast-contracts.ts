import { z } from "zod";

import {
  loanSchema,
  regularGrowthSchema,
  targetGrowthSchema,
} from "@/lib/validation";

const growthKindSchema = z.enum(["compound", "simple", "investment"]);

export const loanForecastRequestSchema = z.object({
  values: loanSchema,
});

export const loanBankOffersRequestSchema = z.object({
  values: loanSchema,
});

export const loanInflationForecastRequestSchema = z.object({
  values: loanSchema,
});

export const investmentRegularForecastRequestSchema = z.object({
  kind: growthKindSchema,
  mode: z.literal("regular"),
  selectedInstrumentId: z.string().optional(),
  values: regularGrowthSchema,
});

export const investmentTargetForecastRequestSchema = z.object({
  kind: growthKindSchema,
  mode: z.literal("target"),
  selectedInstrumentId: z.string().optional(),
  values: targetGrowthSchema,
});

export const investmentForecastRequestSchema = z.discriminatedUnion("mode", [
  investmentRegularForecastRequestSchema,
  investmentTargetForecastRequestSchema,
]);

export const investmentInflationRegularRequestSchema = z.object({
  kind: growthKindSchema,
  mode: z.literal("regular"),
  values: regularGrowthSchema,
});

export const investmentInflationTargetRequestSchema = z.object({
  kind: growthKindSchema,
  mode: z.literal("target"),
  values: targetGrowthSchema,
});

export const investmentInflationForecastRequestSchema = z.discriminatedUnion("mode", [
  investmentInflationRegularRequestSchema,
  investmentInflationTargetRequestSchema,
]);

export type LoanForecastRequest = z.infer<typeof loanForecastRequestSchema>;
export type LoanBankOffersRequest = z.infer<typeof loanBankOffersRequestSchema>;
export type InvestmentForecastRequest = z.infer<typeof investmentForecastRequestSchema>;
export type LoanInflationForecastRequest = z.infer<typeof loanInflationForecastRequestSchema>;
export type InvestmentInflationForecastRequest = z.infer<
  typeof investmentInflationForecastRequestSchema
>;
