import type { GrowthKind, LoanType } from "@/lib/finance";
import {
  getDefaultTurkeyInflationRate,
  getInflationModelCatalog,
  getInflationModelSummaryLine,
  type InflationModelDefinition,
  turkeyInflationSnapshot,
} from "@/lib/inflation-engine";
import {
  getSeedLoanBankPartners,
  getSeedLoanReferenceRate,
  loanBankPartnersSeed,
  loanReferenceRatesSeed,
  type LoanBankPartner,
  type LoanReferenceRate,
} from "@/lib/loan-market-data";

export type {
  LoanBankOfferProfile,
  LoanBankPartner,
  LoanReferenceRate,
} from "@/lib/loan-market-data";

export type SnapshotMode = "curated_snapshot";

export type DataProvider = {
  id: string;
  name: string;
  url: string;
  coverage: string;
  note: string;
};

export type InvestmentReferenceInstrument = {
  id: string;
  label: string;
  annualReturnAssumption: number;
  riskLevel: "low" | "medium" | "high";
  category: string;
  updatedAt: string;
  sourceLabel: string;
  description: string;
};

export type InflationReferencePreset = {
  id: string;
  label: string;
  annualRate: number;
  tone: "low" | "baseline" | "high";
  updatedAt: string;
  modelLabel: string;
  formulaLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  description: string;
};

export type ReferenceOverview = {
  generatedAt: string;
  snapshotMode: SnapshotMode;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  officialInflation: {
    releaseLabel: string;
    monthlyRate: number;
    annualRate: number;
    coreBAnnualRate: number;
  };
  inflationModels: InflationModelDefinition[];
  providers: DataProvider[];
  loanRates: LoanReferenceRate[];
  loanBankPartners: LoanBankPartner[];
  investments: InvestmentReferenceInstrument[];
  inflationPresets: InflationReferencePreset[];
  methodology: {
    loan: string;
    investment: string;
    inflation: string;
    caveats: string[];
  };
};

export const referenceSnapshotMeta = {
  generatedAt: "2026-06-09T09:00:00+03:00",
  snapshotMode: "curated_snapshot" as const,
  snapshotLabel: "Türkiye resmi veri snapshot'ı",
  liveIntegrationStatus:
    "Bu sürüm 5 Haziran 2026'da yayımlanan TÜİK Mayıs 2026 TÜFE verisi ile TCMB Mayıs 2026 beklenti snapshot'ını kullanır. Canlı veri bağlantısı açıldığında aynı modeller otomatik güncellenebilir.",
};

const providers: DataProvider[] = [
  {
    id: "tuik-data-portal",
    name: "TÜİK Veri Portalı",
    url: "https://veriportali.tuik.gov.tr/",
    coverage: "TÜFE, alt kırılımlar, ağırlıklar ve metodoloji",
    note: "Gerçekleşen enflasyon ve resmi endeks yapısı için ana kaynak.",
  },
  {
    id: "tcmb-evds",
    name: "TCMB EVDS",
    url: "https://evds3.tcmb.gov.tr/",
    coverage: "Faiz, enflasyon ve temel ekonomi verileri",
    note: "Canlı kredi ve enflasyon verisi için temel resmi kaynak.",
  },
  {
    id: "tefas",
    name: "TEFAS",
    url: "https://www.tefas.gov.tr/",
    coverage: "Yatırım fonu fiyatları ve özet veriler",
    note: "Fon bazlı canlı karşılaştırmalar için hedef kaynak.",
  },
  {
    id: "kap-mkk",
    name: "KAP / MKK",
    url: "https://www.kap.org.tr/",
    coverage: "Fon ve sirket bildirim verileri",
    note: "Kurumsal bildirim ve ek doğrulama katmanı için hedef kanal.",
  },
];

export const loanReferenceRates: LoanReferenceRate[] = loanReferenceRatesSeed;

export const loanBankPartners: LoanBankPartner[] = loanBankPartnersSeed;

export const investmentReferenceInstruments: InvestmentReferenceInstrument[] = [
  {
    id: "time-deposit",
    label: "TL Mevduat",
    annualReturnAssumption: 42,
    riskLevel: "low",
    category: "Mevduat",
    updatedAt: referenceSnapshotMeta.generatedAt,
    sourceLabel: "Resmi veri modeli + örnek set",
    description: "Daha sakin dalgalanma ve daha ölçülü getiri varsayımı.",
  },
  {
    id: "gold",
    label: "Altın",
    annualReturnAssumption: 34,
    riskLevel: "medium",
    category: "Emtia",
    updatedAt: referenceSnapshotMeta.generatedAt,
    sourceLabel: "Emtia varsayım modeli + örnek set",
    description: "Kur ve emtia fiyatlarına daha duyarlı orta riskli senaryo.",
  },
  {
    id: "balanced-fund",
    label: "Dengeli Fon Sepeti",
    annualReturnAssumption: 39,
    riskLevel: "medium",
    category: "Fon Sepeti",
    updatedAt: referenceSnapshotMeta.generatedAt,
    sourceLabel: "Fon veri modeli + örnek set",
    description: "Çeşitlendirilmiş ve daha dengeli bir orta senaryo.",
  },
  {
    id: "equity-basket",
    label: "Hisse Yoğun Sepet",
    annualReturnAssumption: 52,
    riskLevel: "high",
    category: "Hisse / Fon",
    updatedAt: referenceSnapshotMeta.generatedAt,
    sourceLabel: "Piyasa veri modeli + örnek set",
    description: "Daha sert dalgalanma karşılığında daha yüksek getiri beklentisi.",
  },
];

const inflationModels = getInflationModelCatalog();

export const inflationReferencePresets: InflationReferencePreset[] = [
  {
    id: "inflation-soft-landing",
    label: "Yumuşama",
    annualRate: inflationModels.find((item) => item.id === "market-expectation")?.annualRate ?? 24,
    tone: "low",
    updatedAt: referenceSnapshotMeta.generatedAt,
    modelLabel:
      inflationModels.find((item) => item.id === "market-expectation")?.shortLabel ?? "Beklenti",
    formulaLabel:
      inflationModels.find((item) => item.id === "market-expectation")?.formulaLabel ??
      "12 ay sonrası beklenti",
    sourceLabel:
      inflationModels.find((item) => item.id === "market-expectation")?.sourceLabel ??
      "TCMB Piyasa Katılımcıları Anketi",
    sourceUrl:
      inflationModels.find((item) => item.id === "market-expectation")?.sourceUrl ??
      "https://www.tcmb.gov.tr/",
    description:
      "TCMB piyasa beklentisinin daha hızlı normalleşmeye işaret ettiği alt bant senaryosu.",
  },
  {
    id: "inflation-base",
    label: "Dengeli baz",
    annualRate: inflationModels.find((item) => item.id === "smoothed-trend")?.annualRate ?? 36,
    tone: "baseline",
    updatedAt: referenceSnapshotMeta.generatedAt,
    modelLabel: inflationModels.find((item) => item.id === "smoothed-trend")?.shortLabel ?? "Trend",
    formulaLabel:
      inflationModels.find((item) => item.id === "smoothed-trend")?.formulaLabel ??
      "Yıllık TÜFE + kısa dönem trend",
    sourceLabel:
      inflationModels.find((item) => item.id === "smoothed-trend")?.sourceLabel ??
      "TÜİK TÜFE + trend modeli",
    sourceUrl:
      inflationModels.find((item) => item.id === "smoothed-trend")?.sourceUrl ??
      "https://veriportali.tuik.gov.tr/",
    description:
      "Son resmi TÜFE ile son aylardaki ivmeyi birlikte okuyarak oluşturulan varsayılan karşılaştırma seviyesi.",
  },
  {
    id: "inflation-sticky",
    label: "Katı fiyatlama",
    annualRate: inflationModels.find((item) => item.id === "sticky-sector")?.annualRate ?? 41,
    tone: "high",
    updatedAt: referenceSnapshotMeta.generatedAt,
    modelLabel: inflationModels.find((item) => item.id === "sticky-sector")?.shortLabel ?? "Stres",
    formulaLabel:
      inflationModels.find((item) => item.id === "sticky-sector")?.formulaLabel ??
      "Reel sektör beklentisi",
    sourceLabel:
      inflationModels.find((item) => item.id === "sticky-sector")?.sourceLabel ??
      "TCMB Sektörel Enflasyon Beklentileri",
    sourceUrl:
      inflationModels.find((item) => item.id === "sticky-sector")?.sourceUrl ??
      "https://www.tcmb.gov.tr/",
    description:
      "Reel sektörün daha katı fiyatlama davranışını yansıtan ve nominal hedefleri hızla büyüten üst bant.",
  },
];

export function getLoanReferenceRate(loanType: LoanType) {
  return getSeedLoanReferenceRate(loanType);
}

export function getLoanBankPartners(loanType: LoanType) {
  return getSeedLoanBankPartners(loanType);
}

export function getInvestmentReferenceInstrument(id?: string) {
  if (!id) {
    return undefined;
  }

  return investmentReferenceInstruments.find((item) => item.id === id);
}

export function getInflationReferencePreset(id?: string) {
  if (!id) {
    return undefined;
  }

  return inflationReferencePresets.find((item) => item.id === id);
}

export function getDefaultInflationPreset() {
  return (
    inflationReferencePresets.find((item) => item.tone === "baseline") ??
    inflationReferencePresets[0]
  );
}

export function getDefaultInflationRate() {
  return getDefaultTurkeyInflationRate();
}

export function getGrowthPresetRates(kind: GrowthKind) {
  if (kind === "simple") {
    return [
      { id: "simple-safe", label: "Temkinli", annualRate: 18 },
      { id: "simple-base", label: "Baz", annualRate: 28 },
      { id: "simple-fast", label: "Hızlı", annualRate: 36 },
    ];
  }

  return [
    { id: "compound-safe", label: "Temkinli", annualRate: 24 },
    { id: "compound-base", label: "Baz", annualRate: 34 },
    { id: "compound-fast", label: "Hızlı", annualRate: 46 },
  ];
}

export function getReferenceOverview(): ReferenceOverview {
  return {
    ...referenceSnapshotMeta,
    officialInflation: {
      releaseLabel: turkeyInflationSnapshot.officialReleaseLabel,
      monthlyRate: turkeyInflationSnapshot.officialMonthlyRate,
      annualRate: turkeyInflationSnapshot.officialAnnualRate,
      coreBAnnualRate: turkeyInflationSnapshot.coreBAnnualRate,
    },
    inflationModels,
    providers,
    loanRates: loanReferenceRates,
    loanBankPartners,
    investments: investmentReferenceInstruments,
    inflationPresets: inflationReferencePresets,
    methodology: {
      loan:
        "Kredi sonuçları seed snapshot oranlarıyla başlar; EVDS ve partner feed ayarları açıldığında aynı hesaplar otomatik güncel oranlarla beslenebilir. Gerçek banka teklifi kişiye, skora ve kampanyaya göre değişebilir.",
      investment:
        "Yatırım tarafı canlı tavsiye motoru değildir. Örnek araçlar, farklı getiri bantlarını kolayca karşılaştırabilmen için kullanılır.",
      inflation: `${getInflationModelSummaryLine()} Enflasyon açıldığında sonuç bugünün alım gücüyle de gösterilir; hedef modunda ulaşılması gereken tutarın zamanla nasıl büyüdüğü ayrıca hesaplanır.`,
      caveats: [
        `Bu sürüm canlı veri yerine ${turkeyInflationSnapshot.officialReleaseLabel} ve TCMB Mayıs 2026 beklenti snapshot'ı kullanır.`,
        "Kredi sonuçları bankadan alınmış kişisel teklif yerine geçmez.",
        "Yatırım senaryoları yatırım tavsiyesi değildir.",
      ],
    },
  };
}
