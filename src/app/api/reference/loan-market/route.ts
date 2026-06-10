import { getLoanMarketSnapshot } from "@/lib/server/loan-market-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getLoanMarketSnapshot({ allowAutoRefresh: true }));
}
