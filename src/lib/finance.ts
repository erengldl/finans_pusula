export type GrowthKind = "compound" | "simple" | "investment";

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
};

export type LoanResult = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalCost: number;
  realTotalCost?: number;
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

function toMonths(years: number) {
  return Math.max(1, Math.round(years * MONTHS_IN_YEAR));
}

function annualToMonthlyRate(annualRate: number) {
  return annualRate / 100 / MONTHS_IN_YEAR;
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

function buildContributionSchedule(
  input: ContributionSettingsInput,
  months: number,
) {
  const increaseMonths = getIncreaseMonths(input.contributionIncreaseType);
  const increaseFactor = 1 + input.contributionIncreaseRate / 100;
  const schedule: number[] = [];
  let currentMonthlyContribution = input.monthlyContribution;

  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const calendarMonth = getCalendarMonth(input.startMonth, monthIndex);

    if (monthIndex > 1 && increaseMonths.includes(calendarMonth)) {
      currentMonthlyContribution *= increaseFactor;
    }

    schedule.push(currentMonthlyContribution);
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

function buildBreakdownChartData(
  items: Array<{ name: string; value: number }>,
) {
  return items.filter((item) => item.value > 0);
}

export function getRealValue(
  futureValue: number,
  annualInflationRate: number | undefined,
  years: number,
) {
  if (!annualInflationRate || annualInflationRate <= 0) {
    return futureValue;
  }

  return futureValue / Math.pow(1 + annualInflationRate / 100, years);
}

function realValueIfEnabled(
  value: number,
  inflation: InflationInput,
  years: number,
) {
  return inflation.enabled
    ? getRealValue(value, inflation.annualRate, years)
    : undefined;
}

function calculateCompoundRegular(
  kind: GrowthKind,
  input: RegularGrowthInput,
): RegularGrowthResult {
  const months = toMonths(input.years);
  const monthlyRate = annualToMonthlyRate(input.annualRate);
  const schedule = buildContributionSchedule(input, months);
  let balance = input.initialAmount;
  let totalContributions = input.initialAmount;
  const monthly: MonthlyPlanItem[] = [];
  const yearly: YearlyPoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    const contribution = schedule[month - 1];
    const calendarMonth = getCalendarMonth(input.startMonth, month);
    const calendarYear = getCalendarYear(input.startMonth, input.startYear, month);
    const elapsedYears = month / MONTHS_IN_YEAR;

    balance *= 1 + monthlyRate;
    balance += contribution;
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

function calculateSimpleValueAtMonth(
  initialAmount: number,
  annualRate: number,
  schedule: number[],
  endMonth: number,
) {
  const yearlyRate = annualRate / 100;
  const years = endMonth / MONTHS_IN_YEAR;
  let totalValue = initialAmount + initialAmount * yearlyRate * years;
  let totalContributions = initialAmount;

  for (let month = 1; month <= endMonth; month += 1) {
    const contribution = schedule[month - 1];
    const remainingYears = (endMonth - month + 1) / MONTHS_IN_YEAR;
    const contributionInterest = contribution * yearlyRate * remainingYears;

    totalValue += contribution + contributionInterest;
    totalContributions += contribution;
  }

  return {
    totalValue,
    totalContributions,
    profit: totalValue - totalContributions,
  };
}

function calculateSimpleRegular(
  kind: GrowthKind,
  input: RegularGrowthInput,
): RegularGrowthResult {
  const months = toMonths(input.years);
  const schedule = buildContributionSchedule(input, months);
  const full = calculateSimpleValueAtMonth(
    input.initialAmount,
    input.annualRate,
    schedule,
    months,
  );
  const yearly: YearlyPoint[] = [];
  const monthly: MonthlyPlanItem[] = [];

  for (let month = 1; month <= months; month += 1) {
    const point = calculateSimpleValueAtMonth(
      input.initialAmount,
      input.annualRate,
      schedule,
      month,
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
      plannedContribution: schedule[month - 1],
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
    );
    const elapsedYears = month / MONTHS_IN_YEAR;
    const contributionSummary = getContributionSummary(schedule, month);

    yearly.push({
      year: Math.ceil(elapsedYears),
      totalContributions: point.totalContributions,
      totalValue: point.totalValue,
      profit: point.profit,
      realValue: realValueIfEnabled(
        point.totalValue,
        input.inflation,
        elapsedYears,
      ),
      ...contributionSummary,
    });
  }

  if (months < MONTHS_IN_YEAR || months % MONTHS_IN_YEAR !== 0) {
    const point = calculateSimpleValueAtMonth(
      input.initialAmount,
      input.annualRate,
      schedule,
      months,
    );
    const elapsedYears = months / MONTHS_IN_YEAR;
    const contributionSummary = getContributionSummary(schedule, months);

    yearly.push({
      year: Math.ceil(elapsedYears),
      totalContributions: point.totalContributions,
      totalValue: point.totalValue,
      profit: point.profit,
      realValue: realValueIfEnabled(
        point.totalValue,
        input.inflation,
        elapsedYears,
      ),
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

export function calculateTargetGrowth(
  kind: GrowthKind,
  input: TargetGrowthInput,
): TargetGrowthResult {
  const maxMonths = 1200;
  const monthlyRate = annualToMonthlyRate(input.annualRate);
  const schedule = buildContributionSchedule(input, maxMonths);
  const timeline: TargetTimelinePoint[] = [];
  const yearly: TargetTimelinePoint[] = [];
  let balance = input.currentAmount;
  let totalContributions = input.currentAmount;
  let reachedMonth: number | null = null;

  function targetAtMonth(month: number) {
    const yearsElapsed = month / MONTHS_IN_YEAR;

    if (!input.inflation.enabled) {
      return input.targetAmount;
    }

    return (
      input.targetAmount *
      Math.pow(1 + (input.inflation.annualRate ?? 0) / 100, yearsElapsed)
    );
  }

  function pointAtMonth(month: number, value: number): TargetTimelinePoint {
    const target = targetAtMonth(month);
    const yearsElapsed = month / MONTHS_IN_YEAR;
    const calendarMonth = month > 0 ? getCalendarMonth(input.startMonth, month) : input.startMonth;
    const calendarYear =
      month > 0
        ? getCalendarYear(input.startMonth, input.startYear, month)
        : input.startYear;
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
      plannedContribution: month > 0 ? schedule[month - 1] : 0,
      cumulativeContributions: totalContributions,
      totalContributions,
      projectedBalance: value,
      totalValue: value,
      profit: value - totalContributions,
      target,
      realValue,
      projectedRealBalance: realValue,
      remainingGap: Math.max(0, target - value),
      remainingToTarget: Math.max(0, target - value),
      progressPercent,
      ...contributionSummary,
    };
  }

  const initialPoint = pointAtMonth(0, balance);
  timeline.push(initialPoint);

  if (initialPoint.realValue >= input.targetAmount) {
    reachedMonth = 0;
    yearly.push(initialPoint);
  }

  for (let month = 1; month <= maxMonths && reachedMonth === null; month += 1) {
    const contribution = schedule[month - 1];
    totalContributions += contribution;

    if (kind === "simple") {
      balance = calculateSimpleValueAtMonth(
        input.currentAmount,
        input.annualRate,
        schedule,
        month,
      ).totalValue;
    } else {
      balance *= 1 + monthlyRate;
      balance += contribution;
    }

    const point = pointAtMonth(month, balance);
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
  const finalPoint = timelineWithMilestones[timelineWithMilestones.length - 1];

  return {
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
  const principal = input.principal;
  const monthlyRate = input.monthlyRate / 100;
  const months = Math.max(1, Math.round(input.months));
  const estimatedMonthlyPayment =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;
  let remainingBalance = principal;
  const schedule: PaymentScheduleRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = remainingBalance * monthlyRate;
    let principalPayment = estimatedMonthlyPayment - interest;
    let installment = estimatedMonthlyPayment;

    if (month === months || principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
      installment = principalPayment + interest;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPayment;
    }

    schedule.push({
      month,
      installment,
      interest,
      principal: principalPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  const totalPayment = schedule.reduce((sum, row) => sum + row.installment, 0);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalCost = totalPayment + input.extraFees;

  return {
    monthlyPayment: schedule[0]?.installment ?? 0,
    totalPayment,
    totalInterest,
    totalCost,
    realTotalCost: realValueIfEnabled(
      totalCost,
      input.inflation,
      months / MONTHS_IN_YEAR,
    ),
    schedule,
    chartData: [
      { name: "Anapara", value: principal },
      { name: "Faiz", value: totalInterest },
      { name: "Masraf", value: input.extraFees },
    ].filter((item) => item.value > 0),
  };
}
