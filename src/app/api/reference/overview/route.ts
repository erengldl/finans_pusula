import { getReferenceOverview } from "@/lib/reference-data";
import { getLoanMarketSnapshot } from "@/lib/server/loan-market-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseOverview = getReferenceOverview();
  const loanMarketSnapshot = await getLoanMarketSnapshot({ allowAutoRefresh: true });

  return Response.json({
    ...baseOverview,
    generatedAt: loanMarketSnapshot.generatedAt,
    liveIntegrationStatus: `${loanMarketSnapshot.liveIntegrationStatus} Enflasyon ve yatırım tarafı ise mevcut resmi snapshot ile çalışır.`,
    loanRates: loanMarketSnapshot.referenceRates,
    loanBankPartners: loanMarketSnapshot.bankPartners,
  });
}
