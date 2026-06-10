import {
  calculateLoan,
  calculateRegularGrowth,
  calculateTargetGrowth,
  type GrowthKind,
  type LoanInput,
  type LoanType,
  type RegularGrowthInput,
  type TargetGrowthInput,
} from "@/lib/finance";
import {
  getInflationModelSummaryLine,
  turkeyInflationSnapshot,
} from "@/lib/inflation-engine";
import {
  getDefaultInflationRate,
  inflationReferencePresets,
  getInvestmentReferenceInstrument,
  referenceSnapshotMeta,
  type InvestmentReferenceInstrument,
  type LoanBankPartner,
  type LoanReferenceRate,
} from "@/lib/reference-data";
import { getLoanMarketSnapshot } from "@/lib/server/loan-market-store";

export type ScenarioTone = "cautious" | "baseline" | "optimistic";

export type LoanForecastScenario = {
  id: ScenarioTone;
  label: string;
  description: string;
  monthlyRate: number;
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  realTotalCost?: number;
  differenceFromBaseline: number;
};

export type LoanForecastResponse = {
  generatedAt: string;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  referenceRate: LoanReferenceRate;
  scenarios: LoanForecastScenario[];
  caveats: string[];
};

export type LoanBankOffer = {
  bankId: string;
  bankName: string;
  shortName: string;
  logoPath: string;
  monthlyRate: number;
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  extraFees: number;
  differenceFromBest: number;
  websiteUrl: string;
  applicationUrl: string;
  sourceLabel: string;
  supportsOnlineApplication: boolean;
  integrationMode: LoanBankPartner["integrationMode"];
  note: string;
  updatedAt: string;
};

export type LoanBankOffersResponse = {
  generatedAt: string;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  referenceRate: LoanReferenceRate;
  bestOfferId?: string;
  offers: LoanBankOffer[];
  caveats: string[];
};

export type InvestmentForecastScenario = {
  id: ScenarioTone;
  label: string;
  description: string;
  annualRate: number;
  futureValue?: number;
  profit?: number;
  realValue?: number;
  totalContributions: number;
  monthsToTarget?: number | null;
  nominalTarget?: number;
  estimatedBalance?: number;
  reached?: boolean;
  finalMonthlyContribution?: number;
};

export type InvestmentForecastResponse = {
  generatedAt: string;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  selectedInstrument?: InvestmentReferenceInstrument;
  scenarios: InvestmentForecastScenario[];
  caveats: string[];
};

export type InflationForecastScenario = {
  id: string;
  label: string;
  description: string;
  modelLabel: string;
  formulaLabel: string;
  inflationRate: number;
  nominalValue?: number;
  realValue?: number;
  monthsToTarget?: number | null;
  reached?: boolean;
};

export type InflationForecastResponse = {
  generatedAt: string;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  referenceHeadline: string;
  modelSummary: string;
  scenarios: InflationForecastScenario[];
  caveats: string[];
};

function getLoanRateAdjustments(loanType: LoanType) {
  if (loanType === "mortgage") {
    return { cautious: 0.45, optimistic: -0.25 };
  }

  if (loanType === "vehicle") {
    return { cautious: 0.55, optimistic: -0.3 };
  }

  return { cautious: 0.7, optimistic: -0.35 };
}

export async function buildLoanForecast(input: LoanInput): Promise<LoanForecastResponse> {
  const marketSnapshot = await getLoanMarketSnapshot({ allowAutoRefresh: true });
  const referenceRate =
    marketSnapshot.referenceRates.find((item) => item.loanType === input.loanType) ??
    marketSnapshot.referenceRates[0];
  const baseRate = input.monthlyRate > 0 ? input.monthlyRate : referenceRate.averageMonthlyRate;
  const { cautious, optimistic } = getLoanRateAdjustments(input.loanType);

  const rawScenarios = [
    {
      id: "optimistic" as const,
      label: "İyimser",
      description: "Faiz bandı aşağı gelir ve maliyet daha hızlı gevşer.",
      monthlyRate: Math.max(0, baseRate + optimistic),
    },
    {
      id: "baseline" as const,
      label: "Baz",
      description:
        input.monthlyRate > 0
          ? "Formda girdiğiniz oran baz alınır."
          : "Referans snapshot oranı baz alınır.",
      monthlyRate: baseRate,
    },
    {
      id: "cautious" as const,
      label: "Stres",
      description: "Faiz bandı yükselir ve toplam maliyet artar.",
      monthlyRate: baseRate + cautious,
    },
  ];

  const calculated = rawScenarios.map((scenario) => ({
    ...scenario,
    result: calculateLoan({
      ...input,
      monthlyRate: scenario.monthlyRate,
    }),
  }));

  const baselineScenario =
    calculated.find((scenario) => scenario.id === "baseline") ?? calculated[0];

  return {
    generatedAt: marketSnapshot.generatedAt,
    snapshotLabel: marketSnapshot.snapshotLabel,
    liveIntegrationStatus: marketSnapshot.liveIntegrationStatus,
    referenceRate,
    scenarios: calculated.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      monthlyRate: scenario.monthlyRate,
      monthlyPayment: scenario.result.monthlyPayment,
      totalCost: scenario.result.totalCost,
      totalInterest: scenario.result.totalInterest,
      realTotalCost: scenario.result.realTotalCost,
      differenceFromBaseline: scenario.result.totalCost - baselineScenario.result.totalCost,
    })),
    caveats: [
      "Masraf, sigorta ve kampanya koşulları bankaya göre değişebilir.",
      "Bu panel kişiye özel kredi onayı veya teklif tahmini üretmez.",
    ],
  };
}

export async function buildLoanBankOffers(input: LoanInput): Promise<LoanBankOffersResponse> {
  const marketSnapshot = await getLoanMarketSnapshot({ allowAutoRefresh: true });
  const referenceRate =
    marketSnapshot.referenceRates.find((item) => item.loanType === input.loanType) ??
    marketSnapshot.referenceRates[0];
  const offers = marketSnapshot.bankPartners
    .filter((bank) => bank.offers[input.loanType])
    .map((bank) => {
      const bankProfile = bank.offers[input.loanType];
      const result = calculateLoan({
        ...input,
        monthlyRate: bankProfile.monthlyRate,
        extraFees: bankProfile.typicalFees,
      });

      return {
        bankId: bank.id,
        bankName: bank.name,
        shortName: bank.shortName,
        logoPath: bank.logoPath,
        monthlyRate: bankProfile.monthlyRate,
        monthlyPayment: result.monthlyPayment,
        totalCost: result.totalCost,
        totalInterest: result.totalInterest,
        extraFees: bankProfile.typicalFees,
        differenceFromBest: 0,
        websiteUrl: bank.websiteUrl,
        applicationUrl: bank.applicationUrl,
        sourceLabel: bank.sourceLabel,
        supportsOnlineApplication: bank.supportsOnlineApplication,
        integrationMode: bank.integrationMode,
        note: bankProfile.note,
        updatedAt: bank.updatedAt,
      };
    });

  const sortedOffers = [...offers].sort((left, right) => left.totalCost - right.totalCost);
  const bestOffer = sortedOffers[0];

  return {
    generatedAt: marketSnapshot.generatedAt,
    snapshotLabel: marketSnapshot.snapshotLabel,
    liveIntegrationStatus: marketSnapshot.liveIntegrationStatus,
    referenceRate,
    bestOfferId: bestOffer?.bankId,
    offers: sortedOffers.map((offer) => ({
      ...offer,
      differenceFromBest: bestOffer ? offer.totalCost - bestOffer.totalCost : 0,
    })),
    caveats: [
      "Listelenen oranlar ve masraflar ilk karşılaştırma içindir; kişisel teklif yerine geçmez.",
      "Başvuru, tahsis ve kampanya doğrulaması bankanın kendi kanalında tamamlanır.",
    ],
  };
}

function getRateBand(selectedInstrument?: InvestmentReferenceInstrument) {
  if (!selectedInstrument) {
    return 8;
  }

  if (selectedInstrument.riskLevel === "high") {
    return 16;
  }

  if (selectedInstrument.riskLevel === "medium") {
    return 10;
  }

  return 6;
}

export function buildRegularInvestmentForecast(
  kind: GrowthKind,
  input: RegularGrowthInput,
  selectedInstrumentId?: string,
): InvestmentForecastResponse {
  const selectedInstrument = getInvestmentReferenceInstrument(selectedInstrumentId);
  const band = getRateBand(selectedInstrument);
  const scenarios = [
    {
      id: "cautious" as const,
      label: "Koruyucu",
      description: "Daha düşük getiriyle hedefin ne kadar yavaşlayacağını gösterir.",
      annualRate: Math.max(0, input.annualRate - band),
    },
    {
      id: "baseline" as const,
      label: "Baz",
      description: selectedInstrument
        ? `${selectedInstrument.label} varsayımı baz alınır.`
        : "Kullanıcının yıllık getiri varsayımı baz alınır.",
      annualRate: input.annualRate,
    },
    {
      id: "optimistic" as const,
      label: "Atak",
      description: "Daha güçlü getiri halinde planın nereye çıkabileceğini gösterir.",
      annualRate: input.annualRate + band,
    },
  ].map((scenario) => {
    const result = calculateRegularGrowth(kind, {
      ...input,
      annualRate: scenario.annualRate,
    });

    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      annualRate: scenario.annualRate,
      futureValue: result.futureValue,
      profit: result.profit,
      realValue: result.realValue,
      totalContributions: result.totalContributions,
    };
  });

  return {
    generatedAt: referenceSnapshotMeta.generatedAt,
    snapshotLabel: referenceSnapshotMeta.snapshotLabel,
    liveIntegrationStatus: referenceSnapshotMeta.liveIntegrationStatus,
    selectedInstrument,
    scenarios,
    caveats: [
      "Senaryo bandı canlı yatırım tavsiyesi değildir.",
      "Gerçek getiriler vergi, komisyon ve piyasa oynaklığına göre değişebilir.",
    ],
  };
}

export function buildTargetInvestmentForecast(
  kind: GrowthKind,
  input: TargetGrowthInput,
  selectedInstrumentId?: string,
): InvestmentForecastResponse {
  const selectedInstrument = getInvestmentReferenceInstrument(selectedInstrumentId);
  const band = getRateBand(selectedInstrument);
  const scenarios = [
    {
      id: "cautious" as const,
      label: "Koruyucu",
      description: "Daha düşük getiriyle hedef süresini uzatan senaryo.",
      annualRate: Math.max(0, input.annualRate - band),
    },
    {
      id: "baseline" as const,
      label: "Baz",
      description: selectedInstrument
        ? `${selectedInstrument.label} varsayımı baz alınır.`
        : "Kullanıcının yıllık getiri varsayımı baz alınır.",
      annualRate: input.annualRate,
    },
    {
      id: "optimistic" as const,
      label: "Atak",
      description: "Daha güçlü getiriyle hedef süresini kısaltan senaryo.",
      annualRate: input.annualRate + band,
    },
  ].map((scenario) => {
    const result = calculateTargetGrowth(kind, {
      ...input,
      annualRate: scenario.annualRate,
    });

    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      annualRate: scenario.annualRate,
      totalContributions: result.totalContributions,
      monthsToTarget: result.monthsToTarget,
      nominalTarget: result.nominalTarget,
      estimatedBalance: result.estimatedBalance,
      realValue: result.realValue,
      reached: result.reached,
      finalMonthlyContribution: result.finalMonthlyContribution,
    };
  });

  return {
    generatedAt: referenceSnapshotMeta.generatedAt,
    snapshotLabel: referenceSnapshotMeta.snapshotLabel,
    liveIntegrationStatus: referenceSnapshotMeta.liveIntegrationStatus,
    selectedInstrument,
    scenarios,
    caveats: [
      "Hedef süresi olasılıklı bir projeksiyondur, kesinlik içermez.",
      "Enflasyon ve getiri varsayımları değiştikçe süre önemli ölçüde sapabilir.",
    ],
  };
}

function getInflationScenarioDefinitions() {
  return inflationReferencePresets.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    modelLabel: preset.modelLabel,
    formulaLabel: preset.formulaLabel,
    inflationRate: preset.annualRate,
  }));
}

export function buildLoanInflationForecast(input: LoanInput): InflationForecastResponse {
  const baseInput = {
    ...input,
    inflation: {
      enabled: true,
      annualRate: input.inflation.annualRate ?? getDefaultInflationRate(),
    },
  };

  return {
    generatedAt: referenceSnapshotMeta.generatedAt,
    snapshotLabel: referenceSnapshotMeta.snapshotLabel,
    liveIntegrationStatus: referenceSnapshotMeta.liveIntegrationStatus,
    referenceHeadline: `${turkeyInflationSnapshot.officialReleaseLabel}: aylık %${turkeyInflationSnapshot.officialMonthlyRate.toFixed(2).replace(".", ",")} / yıllık %${turkeyInflationSnapshot.officialAnnualRate.toFixed(2).replace(".", ",")}`,
    modelSummary: getInflationModelSummaryLine(),
    scenarios: getInflationScenarioDefinitions().map((scenario) => {
      const result = calculateLoan({
        ...baseInput,
        inflation: {
          enabled: true,
          annualRate: scenario.inflationRate,
        },
      });

      return {
        id: scenario.id,
        label: scenario.label,
        description: scenario.description,
        modelLabel: scenario.modelLabel,
        formulaLabel: scenario.formulaLabel,
        inflationRate: scenario.inflationRate,
        nominalValue: result.totalCost,
        realValue: result.realTotalCost ?? result.totalCost,
      };
    }),
    caveats: [
      "Nominal kredi maliyeti değişmez; enflasyon sadece bugünün parasıyla karşılığı etkiler.",
      "Yüksek enflasyon, reel maliyeti düşürürken satın alma gücü oynaklığını artırabilir.",
    ],
  };
}

export function buildRegularInflationForecast(
  kind: GrowthKind,
  input: RegularGrowthInput,
): InflationForecastResponse {
  return {
    generatedAt: referenceSnapshotMeta.generatedAt,
    snapshotLabel: referenceSnapshotMeta.snapshotLabel,
    liveIntegrationStatus: referenceSnapshotMeta.liveIntegrationStatus,
    referenceHeadline: `${turkeyInflationSnapshot.officialReleaseLabel}: aylık %${turkeyInflationSnapshot.officialMonthlyRate.toFixed(2).replace(".", ",")} / yıllık %${turkeyInflationSnapshot.officialAnnualRate.toFixed(2).replace(".", ",")}`,
    modelSummary: getInflationModelSummaryLine(),
    scenarios: getInflationScenarioDefinitions().map((scenario) => {
      const result = calculateRegularGrowth(kind, {
        ...input,
        inflation: {
          enabled: true,
          annualRate: scenario.inflationRate,
        },
      });

      return {
        id: scenario.id,
        label: scenario.label,
        description: scenario.description,
        modelLabel: scenario.modelLabel,
        formulaLabel: scenario.formulaLabel,
        inflationRate: scenario.inflationRate,
        nominalValue: result.futureValue,
        realValue: result.realValue ?? result.futureValue,
      };
    }),
    caveats: [
      "Nominal büyüme aynı kalsa da reel karşılık enflasyon bandına göre değişir.",
      "Bu panel gelecekteki gerçek satın alma gücünün yaklaşık bir bandını gösterir.",
    ],
  };
}

export function buildTargetInflationForecast(
  kind: GrowthKind,
  input: TargetGrowthInput,
): InflationForecastResponse {
  return {
    generatedAt: referenceSnapshotMeta.generatedAt,
    snapshotLabel: referenceSnapshotMeta.snapshotLabel,
    liveIntegrationStatus: referenceSnapshotMeta.liveIntegrationStatus,
    referenceHeadline: `${turkeyInflationSnapshot.officialReleaseLabel}: aylık %${turkeyInflationSnapshot.officialMonthlyRate.toFixed(2).replace(".", ",")} / yıllık %${turkeyInflationSnapshot.officialAnnualRate.toFixed(2).replace(".", ",")}`,
    modelSummary: getInflationModelSummaryLine(),
    scenarios: getInflationScenarioDefinitions().map((scenario) => {
      const result = calculateTargetGrowth(kind, {
        ...input,
        inflation: {
          enabled: true,
          annualRate: scenario.inflationRate,
        },
      });

      return {
        id: scenario.id,
        label: scenario.label,
        description: scenario.description,
        modelLabel: scenario.modelLabel,
        formulaLabel: scenario.formulaLabel,
        inflationRate: scenario.inflationRate,
        nominalValue: result.nominalTarget,
        realValue: result.realValue,
        monthsToTarget: result.monthsToTarget,
        reached: result.reached,
      };
    }),
    caveats: [
      "Enflasyon arttıkça ulaşılması gereken nominal hedef büyür.",
      "Bu panel hedef süresinin enflasyon duyarlılığını hızlıca görmenizi sağlar.",
    ],
  };
}
