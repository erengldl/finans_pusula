import type { LoanType } from "@/lib/finance";

export type LoanReferenceIntegrationMode = "snapshot" | "evds";
export type LoanBankIntegrationMode = "snapshot_linkout" | "partner_feed";

export type LoanReferenceRate = {
  loanType: LoanType;
  label: string;
  averageMonthlyRate: number;
  typicalFees: number;
  updatedAt: string;
  sourceLabel: string;
  sourceUrl?: string;
  note: string;
  integrationMode: LoanReferenceIntegrationMode;
  seriesCode?: string;
};

export type LoanBankOfferProfile = {
  monthlyRate: number;
  typicalFees: number;
  note: string;
};

export type LoanBankPartner = {
  id: string;
  name: string;
  shortName: string;
  logoPath: string;
  websiteUrl: string;
  applicationUrl: string;
  sourceLabel: string;
  sourceUrl?: string;
  updatedAt: string;
  integrationMode: LoanBankIntegrationMode;
  supportsOnlineApplication: boolean;
  offers: Record<LoanType, LoanBankOfferProfile>;
};

export type LoanMarketSnapshot = {
  generatedAt: string;
  snapshotLabel: string;
  liveIntegrationStatus: string;
  referenceRates: LoanReferenceRate[];
  bankPartners: LoanBankPartner[];
  refreshSummary: {
    evdsConfigured: boolean;
    evdsUpdated: boolean;
    autoRefreshEnabled: boolean;
    configuredBankFeedCount: number;
    liveBankFeedCount: number;
  };
  caveats: string[];
};

export const loanMarketSeedMeta = {
  generatedAt: "2026-06-09T09:00:00+03:00",
  snapshotLabel: "Kredi seed snapshot'ı",
  liveIntegrationStatus:
    "Kredi ekranı varsayılan olarak uygulama içi seed snapshot ile açılır. EVDS ve banka feed ayarları girildiğinde aynı ekran otomatik güncel veriyle çalışabilir.",
};

export const loanReferenceRatesSeed: LoanReferenceRate[] = [
  {
    loanType: "personal",
    label: "İhtiyaç Kredisi",
    averageMonthlyRate: 3.29,
    typicalFees: 3500,
    updatedAt: loanMarketSeedMeta.generatedAt,
    sourceLabel: "Seed örnek oran",
    sourceUrl: "https://evds3.tcmb.gov.tr/",
    note: "Hızlı karşılaştırma için kullanılır; bankadan bankaya değişebilir.",
    integrationMode: "snapshot",
  },
  {
    loanType: "vehicle",
    label: "Taşıt Kredisi",
    averageMonthlyRate: 3.05,
    typicalFees: 4200,
    updatedAt: loanMarketSeedMeta.generatedAt,
    sourceLabel: "Seed örnek oran",
    sourceUrl: "https://evds3.tcmb.gov.tr/",
    note: "Ekspertiz, kasko ve ek masraflar ayrıca değişebilir.",
    integrationMode: "snapshot",
  },
  {
    loanType: "mortgage",
    label: "Konut Kredisi",
    averageMonthlyRate: 2.79,
    typicalFees: 7500,
    updatedAt: loanMarketSeedMeta.generatedAt,
    sourceLabel: "Seed örnek oran",
    sourceUrl: "https://evds3.tcmb.gov.tr/",
    note: "Ekspertiz, tapu ve bankaya özel ek koşullar dahil olmayabilir.",
    integrationMode: "snapshot",
  },
];

export const loanBankPartnersSeed: LoanBankPartner[] = [
  {
    id: "ziraat",
    name: "Ziraat Bankası",
    shortName: "Ziraat",
    logoPath: "/banks/ziraat.png",
    websiteUrl: "https://www.ziraatbank.com.tr/",
    applicationUrl: "https://www.ziraatbank.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.ziraatbank.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.18,
        typicalFees: 3000,
        note: "Başvuru ve son oran banka kanalında netleşir.",
      },
      vehicle: {
        monthlyRate: 2.93,
        typicalFees: 3950,
        note: "Kasko ve ekspertiz şartları ayrıca değişebilir.",
      },
      mortgage: {
        monthlyRate: 2.64,
        typicalFees: 7450,
        note: "Tapu ve ekspertiz kalemleri şubede netleşir.",
      },
    },
  },
  {
    id: "vakifbank",
    name: "VakıfBank",
    shortName: "VakıfBank",
    logoPath: "/banks/vakifbank.png",
    websiteUrl: "https://www.vakifbank.com.tr/",
    applicationUrl: "https://www.vakifbank.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.vakifbank.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.22,
        typicalFees: 3100,
        note: "Kampanya dönemlerinde oran bandı değişebilir.",
      },
      vehicle: {
        monthlyRate: 2.96,
        typicalFees: 4000,
        note: "Taşıt kredisinde araç yaşına göre koşullar değişebilir.",
      },
      mortgage: {
        monthlyRate: 2.68,
        typicalFees: 7600,
        note: "Konut ekspertiz bedeli ayrıca değişebilir.",
      },
    },
  },
  {
    id: "akbank",
    name: "Akbank",
    shortName: "Akbank",
    logoPath: "/banks/akbank.png",
    websiteUrl: "https://www.akbank.com/",
    applicationUrl: "https://www.akbank.com/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.akbank.com/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.19,
        typicalFees: 2900,
        note: "Dijital başvuruda kampanya koşulları değişebilir.",
      },
      vehicle: {
        monthlyRate: 2.99,
        typicalFees: 3900,
        note: "Araç yaş ve teminat şartı etkileyebilir.",
      },
      mortgage: {
        monthlyRate: 2.74,
        typicalFees: 7200,
        note: "Ekspertiz ve sigorta kalemleri ayrıca belirlenir.",
      },
    },
  },
  {
    id: "garanti",
    name: "Garanti BBVA",
    shortName: "Garanti",
    logoPath: "/banks/garanti.png",
    websiteUrl: "https://www.garantibbva.com.tr/",
    applicationUrl: "https://www.garantibbva.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.garantibbva.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.24,
        typicalFees: 3450,
        note: "Kişisel skora göre faiz bandı değişebilir.",
      },
      vehicle: {
        monthlyRate: 3.08,
        typicalFees: 4300,
        note: "Sigorta ve rehin süreçleri ayrıca değerlendirilir.",
      },
      mortgage: {
        monthlyRate: 2.86,
        typicalFees: 7900,
        note: "Tapu ve ekspertiz kalemleri dahil değildir.",
      },
    },
  },
  {
    id: "isbank",
    name: "İş Bankası",
    shortName: "İş Bankası",
    logoPath: "/banks/isbank.png",
    websiteUrl: "https://www.isbank.com.tr/",
    applicationUrl: "https://www.isbank.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.isbank.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.34,
        typicalFees: 3600,
        note: "Gelir belgesi ve ürün kampanyası sonucu etkileyebilir.",
      },
      vehicle: {
        monthlyRate: 3.12,
        typicalFees: 4500,
        note: "Araç tipi ve yaşına göre şartlar değişebilir.",
      },
      mortgage: {
        monthlyRate: 2.91,
        typicalFees: 8100,
        note: "Konut tipine göre ekspertiz maliyeti değişebilir.",
      },
    },
  },
  {
    id: "qnb",
    name: "QNB",
    shortName: "QNB",
    logoPath: "/banks/qnb.png",
    websiteUrl: "https://www.qnb.com.tr/",
    applicationUrl: "https://www.qnb.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.qnb.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.28,
        typicalFees: 3300,
        note: "Dijital başvuru akışı üzerinden kampanyalar değişebilir.",
      },
      vehicle: {
        monthlyRate: 3.14,
        typicalFees: 4550,
        note: "Araç teminat detayları ayrıca belirlenir.",
      },
      mortgage: {
        monthlyRate: 2.88,
        typicalFees: 8050,
        note: "Kredi tahsis sürecinde ek belge istenebilir.",
      },
    },
  },
  {
    id: "yapikredi",
    name: "Yapı Kredi",
    shortName: "Yapı Kredi",
    logoPath: "/banks/yapikredi.png",
    websiteUrl: "https://www.yapikredi.com.tr/",
    applicationUrl: "https://www.yapikredi.com.tr/",
    sourceLabel: "Banka snapshot'ı",
    sourceUrl: "https://www.yapikredi.com.tr/",
    updatedAt: loanMarketSeedMeta.generatedAt,
    integrationMode: "snapshot_linkout",
    supportsOnlineApplication: true,
    offers: {
      personal: {
        monthlyRate: 3.41,
        typicalFees: 3850,
        note: "Son oran kişisel değerlendirme sonrası netleşir.",
      },
      vehicle: {
        monthlyRate: 3.18,
        typicalFees: 4700,
        note: "Araç teminat şartları sonucu etkileyebilir.",
      },
      mortgage: {
        monthlyRate: 2.95,
        typicalFees: 8300,
        note: "Ekspertiz ve sigorta kalemleri ayrıca uygulanabilir.",
      },
    },
  },
];

export function getSeedLoanReferenceRate(loanType: LoanType) {
  return loanReferenceRatesSeed.find((item) => item.loanType === loanType) ?? loanReferenceRatesSeed[0];
}

export function getSeedLoanBankPartners(loanType: LoanType) {
  return loanBankPartnersSeed.filter((item) => item.offers[loanType]);
}

export function getSeedLoanMarketSnapshot(): LoanMarketSnapshot {
  return {
    ...loanMarketSeedMeta,
    referenceRates: loanReferenceRatesSeed,
    bankPartners: loanBankPartnersSeed,
    refreshSummary: {
      evdsConfigured: false,
      evdsUpdated: false,
      autoRefreshEnabled: false,
      configuredBankFeedCount: 0,
      liveBankFeedCount: 0,
    },
    caveats: [
      "Seed snapshot kişiye özel teklif yerine geçmez.",
      "Partner feed olmayan bankalarda oranlar link-out karşılaştırması için tutulur.",
    ],
  };
}
