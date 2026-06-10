import { describe, expect, it } from "vitest";

import {
  FINANCE_LIMITS,
  annualEffectiveRateToMonthlyRate,
  calculateLoan,
  calculateRegularGrowth,
  calculateTargetGrowth,
} from "@/lib/finance";
import { loanSchema, regularGrowthSchema, targetGrowthSchema } from "@/lib/validation";

const regularBaseInput = {
  initialAmount: 10_000,
  monthlyContribution: 5_000,
  annualRate: 30,
  years: 5,
  startMonth: 1,
  startYear: 2026,
  contributionTiming: "end" as const,
  contributionIncreaseType: "none" as const,
  contributionIncreaseRate: 0,
  inflation: {
    enabled: false,
  },
};

const targetBaseInput = {
  targetAmount: 1_000_000,
  currentAmount: 100_000,
  monthlyContribution: 10_000,
  annualRate: 20,
  startMonth: 1,
  startYear: 2026,
  contributionTiming: "end" as const,
  contributionIncreaseType: "none" as const,
  contributionIncreaseRate: 0,
  inflation: {
    enabled: false,
  },
};

const loanBaseInput = {
  loanType: "personal" as const,
  principal: 250_000,
  months: 36,
  monthlyRate: 3.29,
  extraFees: 3_500,
  inflation: {
    enabled: false,
  },
};

describe("finance engine", () => {
  it("converts an annual effective rate to a monthly rate", () => {
    expect(annualEffectiveRateToMonthlyRate(12)).toBeCloseTo(0.00948879, 6);
  });

  it("supports contribution timing on compound growth", () => {
    const endOfMonth = calculateRegularGrowth("compound", regularBaseInput);
    const beginningOfMonth = calculateRegularGrowth("compound", {
      ...regularBaseInput,
      contributionTiming: "beginning",
    });

    expect(beginningOfMonth.contributionTiming).toBe("beginning");
    expect(beginningOfMonth.futureValue).toBeGreaterThan(endOfMonth.futureValue);
  });

  it("applies February and July contribution increases and crosses calendar years", () => {
    const result = calculateRegularGrowth("compound", {
      ...regularBaseInput,
      startMonth: 11,
      annualRate: 0,
      years: 1,
      monthlyContribution: 1_000,
      contributionIncreaseType: "semiannual_february_july",
      contributionIncreaseRate: 10,
    });

    expect(result.monthly[2]?.calendarYear).toBe(2027);
    expect(result.monthly[3]?.plannedContribution).toBeGreaterThan(result.monthly[2]?.plannedContribution ?? 0);
    expect(result.monthly[8]?.plannedContribution).toBeGreaterThan(result.monthly[7]?.plannedContribution ?? 0);
  });

  it("rejects values above the configured limits", () => {
    expect(
      regularGrowthSchema.safeParse({
        ...regularBaseInput,
        annualRate: FINANCE_LIMITS.rates.annual + 1,
      }).success,
    ).toBe(false);

    expect(
      targetGrowthSchema.safeParse({
        ...targetBaseInput,
        monthlyContribution: FINANCE_LIMITS.currency.max + 1,
      }).success,
    ).toBe(false);

    expect(
      loanSchema.safeParse({
        ...loanBaseInput,
        principal: FINANCE_LIMITS.currency.max + 1,
      }).success,
    ).toBe(false);
  });

  it("marks target failures with the right reason", () => {
    const zeroGrowth = calculateTargetGrowth("compound", {
      ...targetBaseInput,
      currentAmount: 0,
      targetAmount: 100_000,
      monthlyContribution: 0,
      annualRate: 0,
      inflation: {
        enabled: false,
      },
    });

    const negativeRealGrowth = calculateTargetGrowth("compound", {
      ...targetBaseInput,
      currentAmount: 50_000,
      targetAmount: 500_000,
      monthlyContribution: 0,
      annualRate: 2,
      inflation: {
        enabled: true,
        annualRate: 5,
      },
    });

    const insufficientContribution = calculateTargetGrowth("compound", {
      ...targetBaseInput,
      currentAmount: 20_000,
      targetAmount: 1_000_000_000,
      monthlyContribution: 0,
      annualRate: 2,
      inflation: {
        enabled: false,
      },
    });

    const maxHorizonReached = calculateTargetGrowth("compound", {
      ...targetBaseInput,
      currentAmount: 0,
      targetAmount: 1_000_000_000,
      monthlyContribution: 1,
      annualRate: 0.5,
      inflation: {
        enabled: false,
      },
    });

    expect(zeroGrowth.failureReason).toBe("zero_growth");
    expect(negativeRealGrowth.failureReason).toBe("negative_real_growth");
    expect(insufficientContribution.failureReason).toBe("insufficient_contribution");
    expect(maxHorizonReached.failureReason).toBe("max_horizon_reached");
  });

  it("rounds loan installments and keeps the schedule finite", () => {
    const result = calculateLoan({
      ...loanBaseInput,
      principal: 100_000,
      months: 24,
      monthlyRate: 100,
      inflation: {
        enabled: false,
      },
    });

    expect(result.schedule.every((row) => Number.isFinite(row.installment))).toBe(true);
    expect(result.schedule.every((row) => Number.isFinite(row.interest))).toBe(true);
    expect(result.schedule.every((row) => Number.isFinite(row.principal))).toBe(true);
    expect(result.schedule.every((row) => Number.isFinite(row.remainingBalance))).toBe(true);
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
    expect(result.totalCost).toBeCloseTo(result.nominalTotalCost, 2);
  });

  it("discounts loan cost per installment when inflation is enabled", () => {
    const result = calculateLoan({
      ...loanBaseInput,
      principal: 100_000,
      months: 36,
      monthlyRate: 3.29,
      inflation: {
        enabled: true,
        annualRate: 30,
      },
    });

    expect(result.usedAnnualInflationRate).toBe(30);
    expect(result.usedMonthlyInflationRate).toBeGreaterThan(0);
    expect(result.presentValueTotalCost).toBeDefined();
    expect(result.presentValueTotalCost ?? 0).toBeLessThan(result.totalCost);
  });

  it("keeps extreme growth calculations finite", () => {
    const result = calculateRegularGrowth("compound", {
      ...regularBaseInput,
      annualRate: 1_000,
      years: 100,
      monthlyContribution: 1_000,
    });

    expect(Number.isFinite(result.futureValue)).toBe(true);
    expect(Number.isFinite(result.totalContributions)).toBe(true);
    expect(result.monthly.every((row) => Number.isFinite(row.projectedBalance))).toBe(true);
  });
});
