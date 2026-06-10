import { buildLoanForecast } from "@/lib/scenario-engine";
import { loanForecastRequestSchema } from "@/lib/forecast-contracts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loanForecastRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Geçersiz kredi senaryosu isteği.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { values } = parsed.data;

  return Response.json(
    await buildLoanForecast({
      loanType: values.loanType,
      principal: values.principal,
      months: values.months,
      monthlyRate: values.monthlyRate,
      extraFees: values.extraFees,
      inflation: {
        enabled: values.includeInflation,
        annualRate: values.inflationRate,
      },
    }),
  );
}
