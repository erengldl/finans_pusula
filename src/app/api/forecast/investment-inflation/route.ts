import { investmentInflationForecastRequestSchema } from "@/lib/forecast-contracts";
import {
  buildRegularInflationForecast,
  buildTargetInflationForecast,
} from "@/lib/scenario-engine";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = investmentInflationForecastRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Geçersiz enflasyon senaryosu isteği.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (parsed.data.mode === "regular") {
    const { kind, values } = parsed.data;

    return Response.json(
      buildRegularInflationForecast(kind, {
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
          enabled: true,
          annualRate: values.inflationRate,
        },
      }),
    );
  }

  const { kind, values } = parsed.data;

  return Response.json(
    buildTargetInflationForecast(kind, {
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
        enabled: true,
        annualRate: values.inflationRate,
      },
    }),
  );
}
