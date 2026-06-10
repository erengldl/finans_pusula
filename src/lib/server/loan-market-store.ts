import "server-only";

import { z } from "zod";

import type { LoanType } from "@/lib/finance";
import {
  getSeedLoanMarketSnapshot,
  type LoanBankPartner,
  type LoanMarketSnapshot,
  type LoanReferenceRate,
} from "@/lib/loan-market-data";
import { getLoanMarketStorage } from "@/lib/server/loan-market-storage";

const loanTypeSchema = z.enum(["personal", "vehicle", "mortgage"]);

const loanReferenceRateSchema = z.object({
  loanType: loanTypeSchema,
  label: z.string(),
  averageMonthlyRate: z.number(),
  typicalFees: z.number(),
  updatedAt: z.string(),
  sourceLabel: z.string(),
  sourceUrl: z.string().optional(),
  note: z.string(),
  integrationMode: z.enum(["snapshot", "evds"]),
  seriesCode: z.string().optional(),
});

const loanBankOfferProfileSchema = z.object({
  monthlyRate: z.number(),
  typicalFees: z.number(),
  note: z.string(),
});

const fullOffersSchema = z.object({
  personal: loanBankOfferProfileSchema,
  vehicle: loanBankOfferProfileSchema,
  mortgage: loanBankOfferProfileSchema,
});

const partialOffersSchema = z.object({
  personal: loanBankOfferProfileSchema.optional(),
  vehicle: loanBankOfferProfileSchema.optional(),
  mortgage: loanBankOfferProfileSchema.optional(),
});

const loanBankPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  logoPath: z.string(),
  websiteUrl: z.string(),
  applicationUrl: z.string(),
  sourceLabel: z.string(),
  sourceUrl: z.string().optional(),
  updatedAt: z.string(),
  integrationMode: z.enum(["snapshot_linkout", "partner_feed"]),
  supportsOnlineApplication: z.boolean(),
  offers: fullOffersSchema,
});

const loanMarketSnapshotSchema = z.object({
  generatedAt: z.string(),
  snapshotLabel: z.string(),
  liveIntegrationStatus: z.string(),
  referenceRates: z.array(loanReferenceRateSchema),
  bankPartners: z.array(loanBankPartnerSchema),
  refreshSummary: z.object({
    evdsConfigured: z.boolean(),
    evdsUpdated: z.boolean(),
    autoRefreshEnabled: z.boolean(),
    configuredBankFeedCount: z.number(),
    liveBankFeedCount: z.number(),
  }),
  caveats: z.array(z.string()),
});

const bankFeedPayloadSchema = z.object({
  sourceLabel: z.string().optional(),
  sourceUrl: z.string().optional(),
  updatedAt: z.string().optional(),
  offers: partialOffersSchema,
});

type LoanMarketRefreshResult = {
  snapshot: LoanMarketSnapshot;
  updatedSources: string[];
  warnings: string[];
};

type LoanMarketSnapshotOptions = {
  allowAutoRefresh?: boolean;
};

type EvdsSeriesConfig = {
  loanType: LoanType;
  field?: string;
  code?: string;
};

const evdsTemplateDefault = "https://evds2.tcmb.gov.tr/service/evds/series={series}";
const refreshTokenHeader = "x-finans-pusula-refresh-token";

let refreshInFlight: Promise<LoanMarketRefreshResult> | null = null;

function getLoanRateLabel(loanType: LoanType) {
  if (loanType === "mortgage") {
    return "Konut Kredisi";
  }

  if (loanType === "vehicle") {
    return "Taşıt Kredisi";
  }

  return "İhtiyaç Kredisi";
}

function getEvdsSeriesConfigs(): EvdsSeriesConfig[] {
  return [
    {
      loanType: "personal",
      code: process.env.TCMB_EVDS_SERIES_PERSONAL,
      field: process.env.TCMB_EVDS_SERIES_PERSONAL_FIELD,
    },
    {
      loanType: "vehicle",
      code: process.env.TCMB_EVDS_SERIES_VEHICLE,
      field: process.env.TCMB_EVDS_SERIES_VEHICLE_FIELD,
    },
    {
      loanType: "mortgage",
      code: process.env.TCMB_EVDS_SERIES_MORTGAGE,
      field: process.env.TCMB_EVDS_SERIES_MORTGAGE_FIELD,
    },
  ];
}

function getConfiguredBankFeedUrl(bankId: string) {
  return process.env[`LOAN_BANK_FEED_${bankId.toUpperCase()}_URL`];
}

function getConfiguredBankFeedToken(bankId: string) {
  return process.env[`LOAN_BANK_FEED_${bankId.toUpperCase()}_TOKEN`];
}

function isAutoRefreshEnabled() {
  return process.env.LOAN_MARKET_AUTO_REFRESH !== "false";
}

function getRefreshThresholdHours() {
  const rawValue = Number(process.env.LOAN_MARKET_REFRESH_HOURS ?? 12);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return 12;
  }

  return rawValue;
}

function hasRefreshableSources() {
  const hasEvds =
    Boolean(process.env.TCMB_EVDS_API_KEY) &&
    getEvdsSeriesConfigs().some((config) => Boolean(config.code));
  const hasBankFeed = getSeedLoanMarketSnapshot().bankPartners.some((bank) =>
    Boolean(getConfiguredBankFeedUrl(bank.id)),
  );

  return hasEvds || hasBankFeed;
}

function parseFlexibleNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(",") && trimmed.includes(".")) {
    const normalized = trimmed.replaceAll(".", "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const normalized = trimmed.includes(",") ? trimmed.replace(",", ".") : trimmed;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDateValue(value: unknown) {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const trimmed = value.trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return new Date(`${year}-${month}-${day}T12:00:00+03:00`).toISOString();
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split(".");
    return new Date(`${year}-${month}-${day}T12:00:00+03:00`).toISOString();
  }

  const parsed = new Date(trimmed);

  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function getObservationRows(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter(
      (entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null,
    );
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    for (const key of ["items", "series", "data"]) {
      const candidate = record[key];

      if (Array.isArray(candidate)) {
        return candidate.filter(
          (entry): entry is Record<string, unknown> =>
            typeof entry === "object" && entry !== null,
        );
      }
    }
  }

  return [];
}

function getObservationDate(row: Record<string, unknown>) {
  for (const key of ["Tarih", "DATE", "date", "tarih"]) {
    if (key in row) {
      return normalizeDateValue(row[key]);
    }
  }

  return new Date().toISOString();
}

function extractLatestObservation(
  rows: Record<string, unknown>[],
  preferredField?: string,
) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    const fieldKeys = preferredField
      ? [preferredField]
      : Object.keys(row).filter(
          (key) => !["Tarih", "DATE", "date", "tarih"].includes(key),
        );

    for (const fieldKey of fieldKeys) {
      const numericValue = parseFlexibleNumber(row[fieldKey]);

      if (numericValue !== null) {
        return {
          value: numericValue,
          fieldKey,
          observedAt: getObservationDate(row),
        };
      }
    }
  }

  return null;
}

function formatEvdsDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = String(value.getFullYear());

  return `${day}-${month}-${year}`;
}

function buildEvdsRequestUrl(seriesCode: string) {
  const endpointTemplate =
    process.env.TCMB_EVDS_SERIES_ENDPOINT_TEMPLATE ?? evdsTemplateDefault;
  const resolvedTemplate = endpointTemplate.includes("{series}")
    ? endpointTemplate.replace("{series}", encodeURIComponent(seriesCode))
    : `${endpointTemplate}${encodeURIComponent(seriesCode)}`;
  const url = new URL(resolvedTemplate);
  const endDate = new Date();
  const startDate = new Date();

  startDate.setMonth(startDate.getMonth() - 18);

  url.searchParams.set("startDate", formatEvdsDate(startDate));
  url.searchParams.set("endDate", formatEvdsDate(endDate));
  url.searchParams.set("type", "json");
  url.searchParams.set("key", process.env.TCMB_EVDS_API_KEY ?? "");

  return url.toString();
}

async function readStoredLoanMarketSnapshot() {
  const storage = getLoanMarketStorage();
  const result = await storage.getLatest();
  const parsed = loanMarketSnapshotSchema.safeParse(result.snapshot);

  if (parsed.success) {
    return {
      snapshot: parsed.data,
      warning: result.warning ?? null,
    };
  }

  return {
    snapshot: getSeedLoanMarketSnapshot(),
    warning: result.warning ?? "Kaydedilmiş kredi snapshot'ı okunamadı; seed snapshot kullanıldı.",
  };
}

function isSnapshotStale(snapshot: LoanMarketSnapshot) {
  const snapshotDate = new Date(snapshot.generatedAt);

  if (Number.isNaN(snapshotDate.getTime())) {
    return true;
  }

  const ageMs = Date.now() - snapshotDate.getTime();
  const thresholdMs = getRefreshThresholdHours() * 60 * 60 * 1000;

  return ageMs >= thresholdMs;
}

async function fetchEvdsReferenceRates(seedRates: LoanReferenceRate[]) {
  const warnings: string[] = [];
  const apiKey = process.env.TCMB_EVDS_API_KEY;
  const seriesConfigs = getEvdsSeriesConfigs().filter((config) => Boolean(config.code));

  if (!apiKey || seriesConfigs.length === 0) {
    return {
      updated: false,
      updatedCount: 0,
      rates: seedRates,
      warnings,
    };
  }

  const rateMap = new Map(seedRates.map((rate) => [rate.loanType, rate]));
  let updatedCount = 0;

  await Promise.all(
    seriesConfigs.map(async (config) => {
      const seriesCode = config.code;

      if (!seriesCode) {
        return;
      }

      try {
        const response = await fetch(buildEvdsRequestUrl(seriesCode), {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          warnings.push(
            `${getLoanRateLabel(config.loanType)} için EVDS isteği başarısız oldu (${response.status}).`,
          );
          return;
        }

        const payload = (await response.json()) as unknown;
        const rows = getObservationRows(payload);
        const latest = extractLatestObservation(rows, config.field);

        if (!latest) {
          warnings.push(`${getLoanRateLabel(config.loanType)} için EVDS içinde sayı bulunamadı.`);
          return;
        }

        const current = rateMap.get(config.loanType);

        if (!current) {
          return;
        }

        rateMap.set(config.loanType, {
          ...current,
          averageMonthlyRate: latest.value,
          updatedAt: latest.observedAt,
          sourceLabel: "TCMB EVDS",
          sourceUrl: "https://evds3.tcmb.gov.tr/",
          note: `Resmi referans seri (${latest.fieldKey}) otomatik güncellendi. Banka teklifi kişisel değerlendirmeyle ayrıca değişebilir.`,
          integrationMode: "evds",
          seriesCode,
        });
        updatedCount += 1;
      } catch {
        warnings.push(`${getLoanRateLabel(config.loanType)} için EVDS bağlantısı kurulamadı.`);
      }
    }),
  );

  return {
    updated: updatedCount > 0,
    updatedCount,
    rates: seedRates.map((rate) => rateMap.get(rate.loanType) ?? rate),
    warnings,
  };
}

async function fetchPartnerBankFeeds(seedBanks: LoanBankPartner[]) {
  const warnings: string[] = [];
  let configuredCount = 0;
  let liveCount = 0;

  const banks = await Promise.all(
    seedBanks.map(async (bank) => {
      const feedUrl = getConfiguredBankFeedUrl(bank.id);

      if (!feedUrl) {
        return bank;
      }

      configuredCount += 1;

      try {
        const token = getConfiguredBankFeedToken(bank.id);
        const response = await fetch(feedUrl, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (!response.ok) {
          warnings.push(`${bank.name} feed'i başarısız oldu (${response.status}).`);
          return bank;
        }

        const payload = bankFeedPayloadSchema.safeParse(await response.json());

        if (!payload.success) {
          warnings.push(`${bank.name} feed'i beklenen JSON yapısında değil.`);
          return bank;
        }

        liveCount += 1;

        return {
          ...bank,
          sourceLabel: payload.data.sourceLabel ?? "Partner JSON feed",
          sourceUrl: payload.data.sourceUrl ?? feedUrl,
          updatedAt: payload.data.updatedAt ?? new Date().toISOString(),
          integrationMode: "partner_feed" as const,
          offers: {
            personal: payload.data.offers.personal ?? bank.offers.personal,
            vehicle: payload.data.offers.vehicle ?? bank.offers.vehicle,
            mortgage: payload.data.offers.mortgage ?? bank.offers.mortgage,
          },
        };
      } catch {
        warnings.push(`${bank.name} feed'ine bağlanılamadı.`);
        return bank;
      }
    }),
  );

  return {
    banks,
    configuredCount,
    liveCount,
    warnings,
  };
}

function buildLiveStatusMessage(args: {
  evdsUpdated: boolean;
  configuredBankFeedCount: number;
  liveBankFeedCount: number;
  warnings: string[];
}) {
  const parts: string[] = [];

  if (args.evdsUpdated) {
    parts.push("TCMB EVDS referans oranları otomatik güncelleniyor.");
  } else {
    parts.push("TCMB EVDS referans oranı henüz seed snapshot'ta.");
  }

  if (args.liveBankFeedCount > 0) {
    parts.push(
      `${args.liveBankFeedCount} banka partner feed ile güncel çalışıyor, kalan bankalar link-out snapshot modunda gösteriliyor.`,
    );
  } else if (args.configuredBankFeedCount > 0) {
    parts.push("Banka feed bağlantıları tanımlı, fakat son yenilemede canlı veri alınamadı.");
  } else {
    parts.push("Banka kartları şu an link-out snapshot modunda.");
  }

  if (args.warnings.length > 0) {
    parts.push("Bazı kaynaklar yenilenemediği için son geçerli snapshot korundu.");
  }

  return parts.join(" ");
}

async function performLoanMarketRefresh() {
  const seedSnapshot = getSeedLoanMarketSnapshot();
  const [evdsResult, bankFeedResult] = await Promise.all([
    fetchEvdsReferenceRates(seedSnapshot.referenceRates),
    fetchPartnerBankFeeds(seedSnapshot.bankPartners),
  ]);
  const warnings = [...evdsResult.warnings, ...bankFeedResult.warnings];
  const updatedSources: string[] = [];

  if (evdsResult.updated) {
    updatedSources.push("tcmb-evds");
  }

  if (bankFeedResult.liveCount > 0) {
    updatedSources.push("bank-partner-feeds");
  }

  const baseSnapshot: LoanMarketSnapshot = {
    generatedAt: new Date().toISOString(),
    snapshotLabel:
      updatedSources.length > 0 ? "Canlı kredi veri snapshot'ı" : seedSnapshot.snapshotLabel,
    liveIntegrationStatus: buildLiveStatusMessage({
      evdsUpdated: evdsResult.updated,
      configuredBankFeedCount: bankFeedResult.configuredCount,
      liveBankFeedCount: bankFeedResult.liveCount,
      warnings,
    }),
    referenceRates: evdsResult.rates,
    bankPartners: bankFeedResult.banks,
    refreshSummary: {
      evdsConfigured:
        Boolean(process.env.TCMB_EVDS_API_KEY) &&
        getEvdsSeriesConfigs().some((config) => Boolean(config.code)),
      evdsUpdated: evdsResult.updated,
      autoRefreshEnabled: isAutoRefreshEnabled(),
      configuredBankFeedCount: bankFeedResult.configuredCount,
      liveBankFeedCount: bankFeedResult.liveCount,
    },
    caveats: [
      "Kredi hesaplaması kişiye özel banka teklifi üretmez.",
      "Partner feed bağlı olmayan bankalarda son seed snapshot ve yönlendirme bağlantısı kullanılır.",
      ...warnings,
    ],
  };

  const storage = getLoanMarketStorage();
  const persistence = await storage.save(baseSnapshot);
  const snapshot =
    persistence.warning === undefined
      ? baseSnapshot
      : {
          ...baseSnapshot,
          caveats: [...baseSnapshot.caveats, persistence.warning],
        };

  return {
    snapshot,
    updatedSources,
    warnings:
      persistence.warning === undefined ? warnings : [...warnings, persistence.warning],
  };
}

export function isLoanMarketRefreshAuthorized(request: Request) {
  const configuredToken = process.env.LOAN_MARKET_REFRESH_TOKEN;

  if (!configuredToken) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get(refreshTokenHeader) === configuredToken;
}

export async function refreshLoanMarketSnapshot() {
  if (!refreshInFlight) {
    refreshInFlight = performLoanMarketRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function getLoanMarketSnapshot(options: LoanMarketSnapshotOptions = {}) {
  const storage = getLoanMarketStorage();
  const stored = await readStoredLoanMarketSnapshot();
  const storedSnapshot = stored.snapshot;
  const shouldAppendStoredWarning =
    Boolean(stored.warning) && !storedSnapshot.caveats.includes(stored.warning ?? "");

  if (
    options.allowAutoRefresh &&
    isAutoRefreshEnabled() &&
    hasRefreshableSources() &&
    storage.mode !== "seed_read_only" &&
    !stored.warning &&
    isSnapshotStale(storedSnapshot)
  ) {
    try {
      const refreshed = await refreshLoanMarketSnapshot();
      return {
        ...refreshed.snapshot,
        caveats: shouldAppendStoredWarning
          ? [...refreshed.snapshot.caveats, stored.warning ?? ""]
          : refreshed.snapshot.caveats,
      };
    } catch {
      return {
        ...storedSnapshot,
        caveats: shouldAppendStoredWarning
          ? [...storedSnapshot.caveats, stored.warning ?? ""]
          : storedSnapshot.caveats,
      };
    }
  }

  return {
    ...storedSnapshot,
    caveats: shouldAppendStoredWarning
      ? [...storedSnapshot.caveats, stored.warning ?? ""]
      : storedSnapshot.caveats,
  };
}
