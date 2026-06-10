export type GrowthKind = "compound" | "simple" | "investment";

export type ContributionTiming = "beginning" | "end";

export type TargetFailureReason =
  | "insufficient_contribution"
  | "negative_real_growth"
  | "zero_growth"
  | "max_horizon_reached";

export const FINANCE_LIMITS = {
  currency: {
    max: 1_000_000_000,
  },
  rates: {
    annual: 1_000,
    monthly: 100,
    contributionIncrease: 1_000,
  },
  durations: {
    years: 100,
    loanMonths: 600,
    targetMonths: 1_200,
  },
  calendar: {
    startMonthMin: 1,
    startMonthMax: 12,
    startYearMin: 2000,
    startYearMax: 2100,
  },
} as const;

export type InflationInput = {
  enabled: boolean;
  annualRate?: number;
};

export type ContributionIncreaseType = "none" | "annual_february" | "semiannual_february_july";

export type ContributionSettingsInput = {
  monthlyContribution: number;
  startMonth: number;
  startYear: number;
  contributionIncreaseType: ContributionIncreaseType;
  contributionIncreaseRate: number;
  contributionTiming: ContributionTiming;
};

export type MonthlyPlanItem = {
  month: number;
  monthIndex: number;
  calendarMonth: number;
  calendarYear: number;
  label: string;
  plannedContribution: number;
  cumulativeContributions: number;
  totalContributions: number;
  projectedBalance: number;
  totalValue: number;
  projectedRealBalance?: number;
  realValue?: number;
  target?: number;
  remainingToTarget: number;
  remainingGap: number;
  progressPercent: number;
  profit: number;
  milestoneLabel?: string;
};

export type YearlyPoint = {
  year: number;
  totalContributions: number;
  totalValue: number;
  profit: number;
  realValue?: number;
  target?: number;
  startMonthlyContribution: number;
  endMonthlyContribution: number;
  annualContribution: number;
};

export type RegularGrowthInput = ContributionSettingsInput & {
  initialAmount: number;
  annualRate: number;
  years: number;
  inflation: InflationInput;
};

export type RegularGrowthResult = {
  contributionTiming: ContributionTiming;
  futureValue: number;
  totalContributions: number;
  profit: number;
  realValue?: number;
  chartData: Array<{ name: string; value: number }>;
  monthly: MonthlyPlanItem[];
  yearly: YearlyPoint[];
};

export type TargetGrowthInput = ContributionSettingsInput & {
  targetAmount: number;
  currentAmount: number;
  annualRate: number;
  inflation: InflationInput;
};

export type TargetTimelinePoint = MonthlyPlanItem & {
  target: number;
  realValue: number;
  startMonthlyContribution: number;
  endMonthlyContribution: number;
  annualContribution: number;
};

export type TargetGrowthResult = {
  contributionTiming: ContributionTiming;
  targetToday: number;
  monthsToTarget: number | null;
  nominalTarget: number;
  estimatedBalance: number;
  realValue: number;
  totalContributions: number;
  estimatedProfit: number;
  finalMonthlyContribution: number;
  reached: boolean;
  alreadyReached: boolean;
  failureReason: TargetFailureReason | null;
  failureMessage: string | null;
  chartData: Array<{ name: string; value: number }>;
  timeline: TargetTimelinePoint[];
  yearly: TargetTimelinePoint[];
};

export type LoanType = "personal" | "vehicle" | "mortgage";

export type LoanInput = {
  loanType: LoanType;
  principal: number;
  months: number;
  monthlyRate: number;
  extraFees: number;
  inflation: InflationInput;
};

export type PaymentScheduleRow = {
  month: number;
  installment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
  presentValueInstallment?: number;
  cumulativePresentValueCost?: number;
  discountFactor?: number;
};

export type LoanResult = {
  monthlyPayment: number;
  nominalMonthlyPayment: number;
  totalPayment: number;
  nominalTotalPayment: number;
  totalInterest: number;
  totalCost: number;
  nominalTotalCost: number;
  presentValueTotalCost?: number;
  realTotalCost?: number;
  usedAnnualInflationRate?: number;
  usedMonthlyInflationRate?: number;
  schedule: PaymentScheduleRow[];
  chartData: Array<{ name: string; value: number }>;
};

const MONTHS_IN_YEAR = 12;
const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function finiteOr(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toMonths(years: number) {
  return Math.min(
    FINANCE_LIMITS.durations.targetMonths,
    Math.max(1, Math.round(years * MONTHS_IN_YEAR)),
  );
}

export function annualEffectiveRateToMonthlyRate(annualRate: number) {
  if (!Number.isFinite(annualRate)) {
    return 0;
  }

  if (annualRate <= -100) {
    return -1;
  }

  return Math.pow(1 + annualRate / 100, 1 / MONTHS_IN_YEAR) - 1;
}

function getCalendarMonth(startMonth: number, monthIndex: number) {
  return ((startMonth - 1 + monthIndex - 1) % MONTHS_IN_YEAR) + 1;
}

function getCalendarYear(startMonth: number, startYear: number, monthIndex: number) {
  return startYear + Math.floor((startMonth - 1 + monthIndex - 1) / MONTHS_IN_YEAR);
}

function getMonthLabel(calendarMonth: number, calendarYear: number) {
  return `${MONTH_NAMES[calendarMonth - 1]} ${calendarYear}`;
}

function getIncreaseMonths(type: ContributionIncreaseType) {
  if (type === "annual_february") {
    return [2];
  }

  if (type === "semiannual_february_july") {
    return [2, 7];
  }

  return [];
}

function normalizeContributionTiming(timing?: ContributionTiming) {
  return timing ?? "end";
}

function buildContributionSchedule(input: ContributionSettingsInput, months: number) {
  const increaseMonths = getIncreaseMonths(input.contributionIncreaseType);
  const increaseFactor = 1 + input.contributionIncreaseRate / 100;
  const schedule: number[] = [];
  let currentMonthlyContribution = input.monthlyContribution;

  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const calendarMonth = getCalendarMonth(input.startMonth, monthIndex);

    if (monthIndex > 1 && increaseMonths.includes(calendarMonth)) {
      currentMonthlyContribution *= increaseFactor;
    }

    schedule.push(finiteOr(currentMonthlyContribution, 0));
  }

  return schedule;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getContributionSummary(schedule: number[], month: number) {
  if (month <= 0) {
    return {
      startMonthlyContribution: 0,
      endMonthlyContribution: 0,
      annualContribution: 0,
    };
  }

  const periodStartIndex = Math.floor((month - 1) / MONTHS_IN_YEAR) * MONTHS_IN_YEAR;
  const period = schedule.slice(periodStartIndex, month);

  return {
    startMonthlyContribution: period[0] ?? 0,
    endMonthlyContribution: period[period.length - 1] ?? 0,
    annualContribution: sum(period),
  };
}

function applyMilestones<T extends { progressPercent: number; milestoneLabel?: string }>(
  rows: T[],
) {
  const thresholds = [10, 25, 50, 75, 100];
  const reached = new Set<number>();

  return rows.map((row) => {
    const nextThreshold = thresholds.find(
      (threshold) => row.progressPercent >= threshold && !reached.has(threshold),
    );

    if (nextThreshold !== undefined) {
      reached.add(nextThreshold);
      return {
        ...row,
        milestoneLabel:
          nextThreshold === 100 ? "Hedefe ulaşıldı" : `%${nextThreshold} tamamlandı`,
      };
    }

    return row;
  });
}

function buildBreakdownChartData(items: Array<{ name: string; value: number }>) {
  return items.filter((item) => Number.isFinite(item.value) && item.value > 0);
}

export function getRealValue(
  futureValue: number,
  annualInflationRate: number | undefined,
  years: number,
) {
  if (!annualInflationRate || annualInflationRate <= 0) {
    return futureValue;
  }

  const inflationFactor = Math.pow(1 + annualInflationRate / 100, years);

  if (!Number.isFinite(inflationFactor) || inflationFactor <= 0) {
    return futureValue;
  }

  return futureValue / inflationFactor;
}

function realValueIfEnabled(value: number, inflation: InflationInput, years: number) {
  return inflation.enabled ? getRealValue(value, inflation.annualRate, years) : undefined;
}

function calculateSimpleValueAtMonth(
  initialAmount: number,
  annualRate: number,
  schedule: number[],
  endMonth: number,
  contributionTiming: ContributionTiming,
) {
  const yearlyRate = annualRate / 100;
  const years = endMonth / MONTHS_IN_YEAR;
  let totalValue = initialAmount + initialAmount * yearlyRate * years;
  let totalContributions = initialAmount;

  for (let month = 1; month <= endMonth; month += 1) {
    const contribution = schedule[month - 1] ?? 0;
    const remainingMonths =
      endMonth - month + (contributionTiming === "beginning" ? 1 : 0);
    const contributionInterest = contribution * yearlyRate * (remainingMonths / MONTHS_IN_YEAR);

    totalValue += contribution + contributionInterest;
    totalContributions += contribution;
  }

  return {
    totalValue,
    totalContributions,
    profit: totalValue - totalContributions,
  };
}

function getRealAnnualGrowthRate(input: TargetGrowthInput | RegularGrowthInput) {
  if (!input.inflation.enabled || !input.inflation.annualRate) {
    return input.annualRate;
  }

  const nominalFactor = 1 + input.annualRate / 100;
  const inflationFactor = 1 + input.inflation.annualRate / 100;

  if (inflationFactor <= 0) {
    return input.annualRate;
  }

  return ((nominalFactor / inflationFactor) - 1) * 100;
}

export function getTargetFailureMessage(reason: TargetFailureReason | null) {
  if (!reason) {
    return null;
  }

  const messages: Record<TargetFailureReason, string> = {
    insufficient_contribution:
      "Aylık katkı seviyesi bu hedef için yetersiz görünüyor. Katkıyı veya hedef tutarını yeniden dene.",
    negative_real_growth:
      "Enflasyon varsayımı getirinin üstünde kaldığı için hedef bugünün parasıyla küçülüyor.",
    zero_growth:
      "Getiri oranı sıfır ve katkı akışı hedefi büyütmüyor. Başlangıç tutarını veya katkıyı artır.",
    max_horizon_reached:
      "1200 aylık üst sınır içinde hedefe ulaşılamadı. Süreyi, katkıyı veya getiri varsayımını değiştir.",
  };

  return messages[reason];
}

function calculateCompoundRegular(
  kind: GrowthKind,
  input: RegularGrowthInput,
): RegularGrowthResult {
  const months = toMonths(input.years);
  const monthlyRate = annualEffectiveRateToMonthlyRate(input.annualRate);
  const schedule = buildContributionSchedule(input, months);
  const contributionTiming = normalizeContributionTiming(input.contributionTiming);
  let balance = finiteOr(input.initialAmount, 0);
  let totalContributions = finiteOr(input.initialAmount, 0);
  const monthly: MonthlyPlanItem[] = [];
  const yearly: YearlyPoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    const contribution = schedule[month - 1] ?? 0;
    const calendarMonth = getCalendarMonth(input.startMonth, month);
    const calendarYear = getCalendarYear(input.startMonth, input.startYear, month);
    const elapsedYears = month / MONTHS_IN_YEAR;

    const nextBalance =
      contributionTiming === "beginning"
        ? (balance + contribution) * (1 + monthlyRate)
        : balance * (1 + monthlyRate) + contribution;
    balance = finiteOr(nextBalance, balance + contribution);
    totalContributions += contribution;

    monthly.push({
      month,
      monthIndex: month,
      calendarMonth,
      calendarYear,
      label: getMonthLabel(calendarMonth, calendarYear),
      plannedContribution: contribution,
      cumulativeContributions: totalContributions,
      totalContributions,
      projectedBalance: balance,
      totalValue: balance,
      projectedRealBalance: realValueIfEnabled(balance, input.inflation, elapsedYears),
      realValue: realValueIfEnabled(balance, input.inflation, elapsedYears),
      remainingToTarget: 0,
      remainingGap: 0,
      progressPercent: 0,
      profit: balance - totalContributions,
    });

    if (month % MONTHS_IN_YEAR === 0 || month === months) {
      const contributionSummary = getContributionSummary(schedule, month);
      yearly.push({
        year: Math.ceil(elapsedYears),
        totalContributions,
        totalValue: balance,
        profit: balance - totalContributions,
        realValue: realValueIfEnabled(balance, input.inflation, elapsedYears),
        ...contributionSummary,
      });
    }
  }

  const monthlyWithProgress = applyMilestones(
    monthly.map((row) => ({
      ...row,
      remainingToTarget: Math.max(0, balance - row.projectedBalance),
      remainingGap: Math.max(0, balance - row.projectedBalance),
      progressPercent: balance > 0 ? Math.min(100, (row.projectedBalance / balance) * 100) : 100,
      target: balance,
    })),
  );

  return {
    contributionTiming,
    futureValue: balance,
    totalContributions,
    profit: balance - totalContributions,
    realValue: realValueIfEnabled(balance, input.inflation, input.years),
    chartData: buildBreakdownChartData([
      { name: "Başlangıç", value: input.initialAmount },
      { name: "Aylık katkı", value: totalContributions - input.initialAmount },
      { name: kind === "investment" ? "Getiri" : "Faiz", value: balance - totalContributions },
    ]),
    monthly: monthlyWithProgress,
    yearly,
  };
}

function calculateSimpleRegular(
  kind: GrowthKind,
  input: RegularGrowthInput,
): RegularGrowthResult {
  const months = toMonths(input.years);
  const schedule = buildContributionSchedule(input, months);
  const contributionTiming = normalizeContributionTiming(input.contributionTiming);
  const full = calculateSimpleValueAtMonth(
    input.initialAmount,
    input.annualRate,
    schedule,
    months,
    contributionTiming,
  );
  const yearly: YearlyPoint[] = [];
  const monthly: MonthlyPlanItem[] = [];

  for (let month = 1; month <= months; month += 1) {
    const point = calculateSimpleValueAtMonth(
      input.initialAmount,
      input.annualRate,
      schedule,
      month,
      contributionTiming,
    );
    const calendarMonth = getCalendarMonth(input.startMonth, month);
    const calendarYear = getCalendarYear(input.startMonth, input.startYear, month);
    const elapsedYears = month / MONTHS_IN_YEAR;

    monthly.push({
      month,
      monthIndex: month,
      calendarMonth,
      calendarYear,
      label: getMonthLabel(calendarMonth, calendarYear),
      plannedContribution: schedule[month - 1] ?? 0,
      cumulativeContributions: point.totalContributions,
      totalContributions: point.totalContributions,
      projectedBalance: point.totalValue,
      totalValue: point.totalValue,
      projectedRealBalance: realValueIfEnabled(point.totalValue, input.inflation, elapsedYears),
      realValue: realValueIfEnabled(point.totalValue, input.inflation, elapsedYears),
      remainingToTarget: 0,
      remainingGap: 0,
      progressPercent: 0,
      profit: point.profit,
    });
  }

  for (let month = MONTHS_IN_YEAR; month <= months; month += MONTHS_IN_YEAR) {
    const point = calculateSimpleValueAtMonth(
      input.initialAmount,
      input.annualRate,
      schedule,
      month,
      contributionTiming,
    );
    const elapsedYears = month / MONTHS_IN_YEAR;
    const contributionSummary = getContributionSummary(schedule, month);

    yearly.push({
      year: Math.ceil(elapsedYears),
      totalContributions: point.totalContributions,
      totalValue: point.totalValue,
      profit: point.profit,
      realValue: realValueIfEnabled(point.totalValue, input.inflation, elapsedYears),
      ...contributionSummary,
    });
  }

  if (months < MONTHS_IN_YEAR || months % MONTHS_IN_YEAR !== 0) {
    const point = calculateSimpleValueAtMonth(
      input.initialAmount,
      input.annualRate,
      schedule,
      months,
      contributionTiming,
    );
    const elapsedYears = months / MONTHS_IN_YEAR;
    const contributionSummary = getContributionSummary(schedule, months);

    yearly.push({
      year: Math.ceil(elapsedYears),
      totalContributions: point.totalContributions,
      totalValue: point.totalValue,
      profit: point.profit,
      realValue: realValueIfEnabled(point.totalValue, input.inflation, elapsedYears),
      ...contributionSummary,
    });
  }

  const monthlyWithProgress = applyMilestones(
    monthly.map((row) => ({
      ...row,
      remainingToTarget: Math.max(0, full.totalValue - row.projectedBalance),
      remainingGap: Math.max(0, full.totalValue - row.projectedBalance),
      progressPercent:
        full.totalValue > 0
          ? Math.min(100, (row.projectedBalance / full.totalValue) * 100)
          : 100,
      target: full.totalValue,
    })),
  );

  return {
    contributionTiming,
    futureValue: full.totalValue,
    totalContributions: full.totalContributions,
    profit: full.profit,
    realValue: realValueIfEnabled(full.totalValue, input.inflation, input.years),
    chartData: buildBreakdownChartData([
      { name: "Başlangıç", value: input.initialAmount },
      { name: "Aylık katkı", value: full.totalContributions - input.initialAmount },
      { name: kind === "investment" ? "Getiri" : "Faiz", value: full.profit },
    ]),
    monthly: monthlyWithProgress,
    yearly,
  };
}

export function calculateRegularGrowth(
  kind: GrowthKind,
  input: RegularGrowthInput,
): RegularGrowthResult {
  if (kind === "simple") {
    return calculateSimpleRegular(kind, input);
  }

  return calculateCompoundRegular(kind, input);
}

function getTargetFailureReason(args: {
  reachedMonth: number | null;
  input: TargetGrowthInput;
  realAnnualGrowthRate: number;
}) {
  if (args.reachedMonth !== null) {
    return null;
  }

  if (args.input.annualRate <= 0 && args.input.monthlyContribution <= 0) {
    return "zero_growth" as const;
  }

  if (args.input.inflation.enabled && args.realAnnualGrowthRate <= 0) {
    return "negative_real_growth" as const;
  }

  if (args.input.monthlyContribution <= 0) {
    return "insufficient_contribution" as const;
  }

  return "max_horizon_reached" as const;
}

export function calculateTargetGrowth(
  kind: GrowthKind,
  input: TargetGrowthInput,
): TargetGrowthResult {
  const maxMonths = FINANCE_LIMITS.durations.targetMonths;
  const contributionTiming = normalizeContributionTiming(input.contributionTiming);
  const monthlyRate = annualEffectiveRateToMonthlyRate(input.annualRate);
  const realAnnualGrowthRate = getRealAnnualGrowthRate(input);
  const schedule = buildContributionSchedule(input, maxMonths);
  const timeline: TargetTimelinePoint[] = [];
  const yearly: TargetTimelinePoint[] = [];
  let balance = finiteOr(input.currentAmount, 0);
  let totalContributions = finiteOr(input.currentAmount, 0);
  let reachedMonth: number | null = null;

  function targetAtMonth(month: number) {
    const yearsElapsed = month / MONTHS_IN_YEAR;

    if (!input.inflation.enabled) {
      return input.targetAmount;
    }

    return (
      input.targetAmount *
      Math.pow(1 + finiteOr(input.inflation.annualRate ?? 0, 0) / 100, yearsElapsed)
    );
  }

  function pointAtMonth(
    month: number,
    value: number,
    totalContributionValue: number,
  ): TargetTimelinePoint {
    const target = targetAtMonth(month);
    const yearsElapsed = month / MONTHS_IN_YEAR;
    const calendarMonth = month > 0 ? getCalendarMonth(input.startMonth, month) : input.startMonth;
    const calendarYear =
      month > 0 ? getCalendarYear(input.startMonth, input.startYear, month) : input.startYear;
    const realValue = input.inflation.enabled
      ? getRealValue(value, input.inflation.annualRate, yearsElapsed)
      : value;
    const contributionSummary = getContributionSummary(schedule, month);
    const progressPercent = input.inflation.enabled
      ? Math.min(100, (realValue / input.targetAmount) * 100)
      : Math.min(100, (value / input.targetAmount) * 100);

    return {
      month,
      monthIndex: month,
      calendarMonth,
      calendarYear,
      label: getMonthLabel(calendarMonth, calendarYear),
      plannedContribution: month > 0 ? schedule[month - 1] ?? 0 : 0,
      cumulativeContributions: totalContributionValue,
      totalContributions: totalContributionValue,
      projectedBalance: value,
      totalValue: value,
      profit: value - totalContributionValue,
      target,
      realValue,
      projectedRealBalance: realValue,
      remainingGap: Math.max(0, target - value),
      remainingToTarget: Math.max(0, target - value),
      progressPercent,
      ...contributionSummary,
    };
  }

  const initialPoint = pointAtMonth(0, balance, totalContributions);
  timeline.push(initialPoint);

  if (initialPoint.realValue >= input.targetAmount) {
    reachedMonth = 0;
    yearly.push(initialPoint);
  }

  for (let month = 1; month <= maxMonths && reachedMonth === null; month += 1) {
    const contribution = schedule[month - 1] ?? 0;

    if (kind === "simple") {
      const point = calculateSimpleValueAtMonth(
        input.currentAmount,
        input.annualRate,
        schedule,
        month,
        contributionTiming,
      );
      balance = finiteOr(point.totalValue, balance);
      totalContributions = finiteOr(point.totalContributions, totalContributions);
    } else {
      const nextBalance =
        contributionTiming === "beginning"
          ? (balance + contribution) * (1 + monthlyRate)
          : balance * (1 + monthlyRate) + contribution;
      balance = finiteOr(nextBalance, balance + contribution);
      totalContributions += contribution;
    }

    const point = pointAtMonth(month, balance, totalContributions);
    timeline.push(point);

    if (month % MONTHS_IN_YEAR === 0) {
      yearly.push(point);
    }

    if (point.realValue >= input.targetAmount) {
      reachedMonth = month;

      if (month % MONTHS_IN_YEAR !== 0) {
        yearly.push(point);
      }
    }
  }

  const timelineWithMilestones = applyMilestones(timeline);
  const finalPoint = timelineWithMilestones[timelineWithMilestones.length - 1] ?? initialPoint;
  const failureReason = getTargetFailureReason({
    reachedMonth,
    input,
    realAnnualGrowthRate,
  });

  return {
    contributionTiming,
    targetToday: input.targetAmount,
    monthsToTarget: reachedMonth,
    nominalTarget: finalPoint.target,
    estimatedBalance: finalPoint.totalValue,
    realValue: finalPoint.realValue,
    totalContributions: finalPoint.totalContributions,
    estimatedProfit: finalPoint.profit,
    finalMonthlyContribution: finalPoint.endMonthlyContribution,
    reached: reachedMonth !== null,
    alreadyReached: reachedMonth === 0,
    failureReason,
    failureMessage: getTargetFailureMessage(failureReason),
    chartData: buildBreakdownChartData([
      {
        name: kind === "investment" ? "Mevcut yatırım" : "Mevcut birikim",
        value: input.currentAmount,
      },
      { name: "Aylık katkı", value: finalPoint.totalContributions - input.currentAmount },
      { name: kind === "investment" ? "Getiri" : "Faiz", value: finalPoint.profit },
    ]),
    timeline: timelineWithMilestones,
    yearly,
  };
}

export function calculateLoan(input: LoanInput): LoanResult {
  const principal = finiteOr(input.principal, 0);
  const monthlyRate = finiteOr(input.monthlyRate, 0) / 100;
  const months = Math.min(
    FINANCE_LIMITS.durations.loanMonths,
    Math.max(1, Math.round(input.months)),
  );
  const nominalMonthlyPaymentRaw =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;
  const nominalMonthlyPayment = roundCurrency(finiteOr(nominalMonthlyPaymentRaw, principal / months));
  let remainingBalance = roundCurrency(principal);
  const annualInflationRate = input.inflation.enabled
    ? finiteOr(input.inflation.annualRate ?? 0, 0)
    : 0;
  const monthlyInflationRate = input.inflation.enabled
    ? annualEffectiveRateToMonthlyRate(annualInflationRate)
    : 0;
  const usedMonthlyInflationRate = input.inflation.enabled
    ? roundCurrency(monthlyInflationRate * 100)
    : undefined;
  const schedule: PaymentScheduleRow[] = [];
  let nominalPaymentTotal = 0;
  let totalInterest = 0;
  let presentValueRunningTotal = 0;

  for (let month = 1; month <= months; month += 1) {
    const interest = roundCurrency(remainingBalance * monthlyRate);
    let principalPayment = roundCurrency(nominalMonthlyPayment - interest);
    let installment = nominalMonthlyPayment;

    if (month === months || principalPayment > remainingBalance) {
      principalPayment = roundCurrency(remainingBalance);
      installment = roundCurrency(principalPayment + interest);
      remainingBalance = 0;
    } else {
      remainingBalance = roundCurrency(remainingBalance - principalPayment);
    }

    const discountFactor = input.inflation.enabled
      ? finiteOr(1 / Math.pow(1 + monthlyInflationRate, month), 1)
      : 1;
    const presentValueInstallment = roundCurrency(installment * discountFactor);

    nominalPaymentTotal += installment;
    totalInterest += interest;
    presentValueRunningTotal += presentValueInstallment;

    schedule.push({
      month,
      installment,
      interest,
      principal: principalPayment,
      remainingBalance: Math.max(0, remainingBalance),
      presentValueInstallment,
      cumulativePresentValueCost: roundCurrency(presentValueRunningTotal + input.extraFees),
      discountFactor,
    });
  }

  const totalPayment = roundCurrency(nominalPaymentTotal);
  const totalCost = roundCurrency(totalPayment + input.extraFees);
  const presentValueTotalCost = input.inflation.enabled
    ? roundCurrency(presentValueRunningTotal + input.extraFees)
    : undefined;

  return {
    monthlyPayment: schedule[0]?.installment ?? 0,
    nominalMonthlyPayment: schedule[0]?.installment ?? 0,
    totalPayment,
    nominalTotalPayment: totalPayment,
    totalInterest: roundCurrency(totalInterest),
    totalCost,
    nominalTotalCost: totalCost,
    presentValueTotalCost,
    realTotalCost: presentValueTotalCost,
    usedAnnualInflationRate: input.inflation.enabled ? annualInflationRate : undefined,
    usedMonthlyInflationRate,
    schedule,
    chartData: [
      { name: "Anapara", value: principal },
      { name: "Faiz", value: totalInterest },
      { name: "Masraf", value: input.extraFees },
    ].filter((item) => item.value > 0),
  };
}
