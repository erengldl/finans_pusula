export type TurkeyInflationObservation = {
  period: string;
  label: string;
  monthlyRate: number;
  annualRate: number;
  coreBAnnualRate: number;
};

export type TurkeyInflationExpectations = {
  updatedAt: string;
  marketParticipants12m: number;
  marketParticipants24m: number;
  yearEnd2026: number;
  realSector12m: number;
  households12m: number;
};

export type InflationModelFamily =
  | "official_cpi"
  | "expectation"
  | "smoothing"
  | "hybrid";

export type InflationModelDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  family: InflationModelFamily;
  annualRate: number;
  monthlyEquivalentRate: number;
  formulaLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  updatedAt: string;
  description: string;
};

export type TurkeyInflationSnapshot = {
  capturedAt: string;
  officialReleaseLabel: string;
  officialMonthlyRate: number;
  officialAnnualRate: number;
  coreBAnnualRate: number;
  expectations: TurkeyInflationExpectations;
  recentSeries: TurkeyInflationObservation[];
};

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

function annualToMonthlyEquivalentRate(annualRate: number) {
  return roundToTwo((Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100);
}

function annualizeMonthlyRate(monthlyRate: number) {
  return roundToTwo((Math.pow(1 + monthlyRate / 100, 12) - 1) * 100);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function blendRates(primary: number, secondary: number, primaryWeight: number) {
  return roundToTwo(primary * primaryWeight + secondary * (1 - primaryWeight));
}

function getRecentMonthlyAverage(
  series: TurkeyInflationObservation[],
  months: number,
) {
  return average(series.slice(-months).map((item) => item.monthlyRate));
}

export const turkeyInflationSnapshot: TurkeyInflationSnapshot = {
  capturedAt: "2026-06-09T09:00:00+03:00",
  officialReleaseLabel: "TÜİK Mayıs 2026 TÜFE",
  officialMonthlyRate: 1.71,
  officialAnnualRate: 32.61,
  coreBAnnualRate: 31.3,
  expectations: {
    updatedAt: "2026-05-26T10:00:00+03:00",
    marketParticipants12m: 23.4,
    marketParticipants24m: 18.0,
    yearEnd2026: 27.5,
    realSector12m: 41.0,
    households12m: 59.86,
  },
  recentSeries: [
    {
      period: "2026-01",
      label: "Ocak 2026",
      monthlyRate: 4.84,
      annualRate: 30.65,
      coreBAnnualRate: 30.11,
    },
    {
      period: "2026-02",
      label: "Şubat 2026",
      monthlyRate: 2.96,
      annualRate: 31.53,
      coreBAnnualRate: 29.91,
    },
    {
      period: "2026-03",
      label: "Mart 2026",
      monthlyRate: 1.94,
      annualRate: 30.87,
      coreBAnnualRate: 30.11,
    },
    {
      period: "2026-04",
      label: "Nisan 2026",
      monthlyRate: 4.18,
      annualRate: 32.37,
      coreBAnnualRate: 30.51,
    },
    {
      period: "2026-05",
      label: "Mayıs 2026",
      monthlyRate: 1.71,
      annualRate: 32.61,
      coreBAnnualRate: 31.3,
    },
  ],
};

export function getInflationModelCatalog(): InflationModelDefinition[] {
  const recentThreeMonthMonthlyAverage = getRecentMonthlyAverage(
    turkeyInflationSnapshot.recentSeries,
    3,
  );
  const recentThreeMonthAnnualized = annualizeMonthlyRate(
    recentThreeMonthMonthlyAverage,
  );
  const officialAnnual = turkeyInflationSnapshot.officialAnnualRate;
  const smoothedTrendAnnual = blendRates(officialAnnual, recentThreeMonthAnnualized, 0.6);

  return [
    {
      id: "market-expectation",
      label: "TCMB piyasa beklentisi",
      shortLabel: "Beklenti",
      family: "expectation",
      annualRate: turkeyInflationSnapshot.expectations.marketParticipants12m,
      monthlyEquivalentRate: annualToMonthlyEquivalentRate(
        turkeyInflationSnapshot.expectations.marketParticipants12m,
      ),
      formulaLabel: "12 ay sonrası piyasa katılımcıları beklentisi",
      sourceLabel: "TCMB Piyasa Katılımcıları Anketi",
      sourceUrl:
        "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB%2BTR/Main%2BMenu/Istatistikler/Egilim%2BAnketleri/Piyasa%2BKatilimcilari%2BAnketi/",
      updatedAt: turkeyInflationSnapshot.expectations.updatedAt,
      description:
        "Kısa ve orta vadede daha hızlı normalleşme bekleyen baz dışı yumuşama senaryosu.",
    },
    {
      id: "official-cpi",
      label: "Son gerçekleşen resmi TÜFE",
      shortLabel: "Resmi TÜFE",
      family: "official_cpi",
      annualRate: officialAnnual,
      monthlyEquivalentRate: annualToMonthlyEquivalentRate(officialAnnual),
      formulaLabel: "Son gerçekleşen yıllık TÜFE",
      sourceLabel: "TÜİK TÜFE",
      sourceUrl: "https://veriportali.tuik.gov.tr/tr/press/58296",
      updatedAt: turkeyInflationSnapshot.capturedAt,
      description:
        "En son yayımlanan resmi yıllık TÜFE oranını doğrudan baz alan referans katman.",
    },
    {
      id: "smoothed-trend",
      label: "Düzgünleştirilmiş trend",
      shortLabel: "Trend",
      family: "smoothing",
      annualRate: smoothedTrendAnnual,
      monthlyEquivalentRate: annualToMonthlyEquivalentRate(smoothedTrendAnnual),
      formulaLabel: "0,6 x yıllık TÜFE + 0,4 x 3 aylık yıllıklandırılmış trend",
      sourceLabel: "TÜİK TÜFE + trend modeli",
      sourceUrl: "https://veriportali.tuik.gov.tr/tr/press/58296",
      updatedAt: turkeyInflationSnapshot.capturedAt,
      description:
        "Son resmi oranla yakın dönem aylık ivmeyi birlikte okuyarak daha dengeli orta senaryo üretir.",
    },
    {
      id: "sticky-sector",
      label: "Katı fiyatlama stresi",
      shortLabel: "Stres",
      family: "hybrid",
      annualRate: turkeyInflationSnapshot.expectations.realSector12m,
      monthlyEquivalentRate: annualToMonthlyEquivalentRate(
        turkeyInflationSnapshot.expectations.realSector12m,
      ),
      formulaLabel: "12 ay sonrası reel sektör enflasyon beklentisi",
      sourceLabel: "TCMB Sektörel Enflasyon Beklentileri",
      sourceUrl:
        "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB%2BTR/Main%2BMenu/Istatistikler/Egilim%2BAnketleri/Sektorel%2BEnflasyon%2BBeklentileri/",
      updatedAt: turkeyInflationSnapshot.expectations.updatedAt,
      description:
        "Fiyatlama davranışının daha katı kaldığı ve hedeflerin nominal olarak daha hızlı büyüdüğü üst bant.",
    },
  ];
}

export function getInflationModelById(id: string) {
  return getInflationModelCatalog().find((item) => item.id === id);
}

export function getDefaultTurkeyInflationRate() {
  return getInflationModelById("smoothed-trend")?.annualRate ?? turkeyInflationSnapshot.officialAnnualRate;
}

export function getInflationReferenceHeadline() {
  return `${turkeyInflationSnapshot.officialReleaseLabel}: aylık %${turkeyInflationSnapshot.officialMonthlyRate.toFixed(2).replace(".", ",")} / yıllık %${turkeyInflationSnapshot.officialAnnualRate.toFixed(2).replace(".", ",")}`;
}

export function getInflationModelSummaryLine() {
  return `${getInflationReferenceHeadline()}. Karşılaştırma bandı TCMB Mayıs 2026 beklentileri ve son 3 aylık TÜFE trendi ile üretilir.`;
}
