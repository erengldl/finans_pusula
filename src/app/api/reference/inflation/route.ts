import { getReferenceOverview } from "@/lib/reference-data";

export const revalidate = 3600;

export async function GET() {
  const overview = getReferenceOverview();

  return Response.json({
    generatedAt: overview.generatedAt,
    snapshotMode: overview.snapshotMode,
    snapshotLabel: overview.snapshotLabel,
    liveIntegrationStatus: overview.liveIntegrationStatus,
    officialInflation: overview.officialInflation,
    inflationModels: overview.inflationModels,
    inflationPresets: overview.inflationPresets,
    methodology: overview.methodology.inflation,
    caveats: overview.methodology.caveats,
  });
}
