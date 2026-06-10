import { loanInflationForecastRequestSchema } from "@/lib/forecast-contracts";
import { buildLoanInflationForecast } from "@/lib/scenario-engine";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loanInflationForecastRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Geçersiz enflasyon senaryosu isteği.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { values } = parsed.data;

  return Response.json(
    buildLoanInflationForecast({
      loanType: values.loanType,
      principal: values.principal,
      months: values.months,
      monthlyRate: values.monthlyRate,
      extraFees: values.extraFees,
      inflation: {
        enabled: true,
        annualRate: values.inflationRate,
      },
    }),
  );
}
