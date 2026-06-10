import { investmentForecastRequestSchema } from "@/lib/forecast-contracts";
import {
  buildRegularInvestmentForecast,
  buildTargetInvestmentForecast,
} from "@/lib/scenario-engine";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = investmentForecastRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Geçersiz yatırım senaryosu isteği.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (parsed.data.mode === "regular") {
    const { kind, values, selectedInstrumentId } = parsed.data;

    return Response.json(
      buildRegularInvestmentForecast(
        kind,
        {
          initialAmount: values.initialAmount,
          monthlyContribution: values.monthlyContribution,
          annualRate: values.annualRate,
          years: values.years,
          startMonth: values.startMonth,
          startYear: values.startYear,
          contributionTiming: values.contributionTiming,
          contributionIncreaseType: values.contributionIncreaseType,
          contributionIncreaseRate: values.contributionIncreaseRate,
          inflation: {
            enabled: values.includeInflation,
            annualRate: values.inflationRate,
          },
        },
        selectedInstrumentId,
      ),
    );
  }

  const { kind, values, selectedInstrumentId } = parsed.data;

  return Response.json(
    buildTargetInvestmentForecast(
      kind,
      {
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        monthlyContribution: values.monthlyContribution,
        annualRate: values.annualRate,
        startMonth: values.startMonth,
        startYear: values.startYear,
        contributionTiming: values.contributionTiming,
        contributionIncreaseType: values.contributionIncreaseType,
        contributionIncreaseRate: values.contributionIncreaseRate,
        inflation: {
          enabled: values.includeInflation,
          annualRate: values.inflationRate,
        },
      },
      selectedInstrumentId,
    ),
  );
}
