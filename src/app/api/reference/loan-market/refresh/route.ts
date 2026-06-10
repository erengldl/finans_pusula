import {
  isLoanMarketRefreshAuthorized,
  refreshLoanMarketSnapshot,
} from "@/lib/server/loan-market-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLoanMarketRefreshAuthorized(request)) {
    return Response.json(
      {
        error:
          "Yenileme yetkisi yok. LOAN_MARKET_REFRESH_TOKEN tanımlayıp x-finans-pusula-refresh-token başlığı ile gönder.",
      },
      { status: 403 },
    );
  }

  const result = await refreshLoanMarketSnapshot();

  return Response.json(result);
}
