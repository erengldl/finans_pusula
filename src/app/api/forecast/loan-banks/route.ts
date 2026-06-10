import { loanBankOffersRequestSchema } from "@/lib/forecast-contracts";
import { buildLoanBankOffers } from "@/lib/scenario-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loanBankOffersRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Geçersiz banka karşılaştırma isteği.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { values } = parsed.data;

  return Response.json(
    await buildLoanBankOffers({
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
