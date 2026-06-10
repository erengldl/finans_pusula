"use client";

import {
  Document,
  Font,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { MonthlyPlanItem } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

Font.register({
  family: "PdfSans",
  fonts: [
    { src: "/fonts/pdf-sans-regular.ttf", fontWeight: 400 },
    { src: "/fonts/pdf-sans-bold.ttf", fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

export type ChecklistSummary = {
  moduleTitle: string;
  targetLabel: string;
  targetValue: number;
  currentAmount: number;
  firstMonthlyContribution: number;
  annualRate: number;
  inflationEnabled: boolean;
  inflationRate?: number;
  contributionTimingLabel?: string;
  contributionModel: string;
  durationLabel: string;
  scenarioLabel?: string;
  scenarioDetail?: string;
  referenceSource?: string;
  generatedAtLabel?: string;
  disclaimer?: string;
};

type SavingsChecklistPdfProps = {
  rows: MonthlyPlanItem[];
  summary: ChecklistSummary;
  fileName: string;
};

const motivationalQuotes = [
  'Lao Tzu: "Bin millik bir yolculuk, tek bir adımla başlar."',
  'Konfüçyüs: "Durmadığın sürece ne kadar yavaş gittiğinin hiçbir önemi yoktur."',
  'Vincent van Gogh: "Büyük işler, bir dizi küçük şeyin bir araya getirilmesiyle başarılır."',
  'Robert Collier: "Başarı, her gün bıkmadan usanmadan tekrarlanan küçük çabaların toplamıdır."',
];

function getQuoteForPage(pageIndex: number) {
  return motivationalQuotes[pageIndex % motivationalQuotes.length];
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "PdfSans",
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  hero: {
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    backgroundColor: "#F0FDF4",
  },
  heroTop: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 9,
    color: "#166534",
    fontWeight: 700,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    lineHeight: 1.12,
    color: "#111827",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 9,
    color: "#4B5563",
    marginTop: 7,
  },
  quoteText: {
    fontSize: 8.8,
    lineHeight: 1.35,
    color: "#166534",
    marginTop: 8,
    maxWidth: 395,
  },
  durationBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
    backgroundColor: "#166534",
  },
  durationLabel: {
    fontSize: 7,
    color: "#DCFCE7",
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: 700,
  },
  motivationBox: {
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: "#FFFFFF",
  },
  motivationText: {
    fontSize: 8.8,
    lineHeight: 1.45,
    color: "#166534",
  },
  summaryGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  summaryItem: {
    width: "32%",
    minHeight: 39,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginRight: 6,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 10,
    lineHeight: 1.25,
    color: "#111827",
    fontWeight: 700,
  },
  sectionHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 6,
  },
  periodTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#166534",
  },
  periodSubtitle: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 3,
  },
  printHint: {
    fontSize: 8,
    color: "#6B7280",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#F8FAF7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 6.6,
    color: "#6B7280",
    fontWeight: 700,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    minHeight: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  rowAlt: {
    backgroundColor: "#FCFDFB",
  },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: "#166534",
    borderRadius: 2,
    marginTop: 3,
  },
  monthNumber: {
    fontSize: 7.5,
    color: "#111827",
    fontWeight: 700,
    marginBottom: 2,
  },
  monthLabel: {
    fontSize: 6.8,
    color: "#6B7280",
  },
  valueText: {
    fontSize: 7.1,
    color: "#111827",
    fontWeight: 700,
  },
  mutedText: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 2,
  },
  progressOuter: {
    width: 58,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
  },
  progressInner: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  milestone: {
    fontSize: 6.7,
    color: "#166534",
    marginTop: 3,
  },
  notesLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    height: 11,
    width: "100%",
  },
  footer: {
    marginTop: 10,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 7.6,
    lineHeight: 1.35,
    color: "#166534",
    textAlign: "center",
  },
  footerStrong: {
    fontSize: 7.6,
    color: "#166534",
    fontWeight: 700,
  },
});

function chunkRows(rows: MonthlyPlanItem[], size: number) {
  const chunks: MonthlyPlanItem[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

function progressWidth(progressPercent: number) {
  return `${Math.min(100, Math.max(0, progressPercent))}%`;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Header({
  summary,
  quote,
  compact,
}: {
  summary: ChecklistSummary;
  quote: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <View style={[styles.hero, { padding: 12, marginBottom: 12 }]}>
        <Text style={styles.eyebrow}>{summary.moduleTitle}</Text>
        <Text style={[styles.title, { fontSize: 17 }]}>Aylık Takip Planı</Text>
        <Text style={styles.quoteText}>{quote}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.eyebrow}>{summary.moduleTitle}</Text>
            <Text style={styles.title}>Aylık Takip Planı</Text>
            <Text style={styles.subtitle}>
              Hedefine giden aylık plan. İndir, takip et, tamamladıkça işaretle.
            </Text>
            <Text style={styles.quoteText}>{quote}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationLabel}>Tahmini süre</Text>
            <Text style={styles.durationValue}>{summary.durationLabel}</Text>
          </View>
        </View>
        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>
            Bu plan, finansal hedefini yönetilebilir aylık adımlara böler. Her ay
            attığın küçük ama düzenli adımlar, büyük sonuca dönüşür.
          </Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryItem label={summary.targetLabel} value={formatCurrency(summary.targetValue)} />
        <SummaryItem label="Mevcut birikim" value={formatCurrency(summary.currentAmount)} />
        <SummaryItem
          label="İlk aylık birikim"
          value={formatCurrency(summary.firstMonthlyContribution)}
        />
        <SummaryItem label="Getiri oranı" value={formatPercent(summary.annualRate)} />
        <SummaryItem
          label="Enflasyon"
          value={
            summary.inflationEnabled
              ? formatPercent(summary.inflationRate ?? 0)
              : "Hesaba katılmadı"
          }
        />
        {summary.contributionTimingLabel ? (
          <SummaryItem label="Katkı zamanı" value={summary.contributionTimingLabel} />
        ) : null}
        <SummaryItem label="Aylık artış modeli" value={summary.contributionModel} />
        {summary.scenarioLabel ? (
          <SummaryItem label="Senaryo" value={summary.scenarioLabel} />
        ) : null}
        {summary.scenarioDetail ? (
          <SummaryItem label="Senaryo notu" value={summary.scenarioDetail} />
        ) : null}
        {summary.referenceSource ? (
          <SummaryItem label="Veri kaynağı" value={summary.referenceSource} />
        ) : null}
        {summary.generatedAtLabel ? (
          <SummaryItem label="Güncelleme zamanı" value={summary.generatedAtLabel} />
        ) : null}
      </View>
    </>
  );
}

function ChecklistTable({ rows, groupIndex }: { rows: MonthlyPlanItem[]; groupIndex: number }) {
  const firstMonth = rows[0]?.monthIndex ?? 1;
  const lastMonth = rows[rows.length - 1]?.monthIndex ?? firstMonth;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.periodTitle}>
            Dönem {groupIndex + 1}: Ay {firstMonth}-{lastMonth}
          </Text>
          <Text style={styles.periodSubtitle}>Her satırı tamamladığında kutuyu işaretle.</Text>
        </View>
        <Text style={styles.printHint}>Planı her ay tamamladığında kutuyu işaretle.</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { width: "6%" }]}>İşaret</Text>
          <Text style={[styles.headerCell, { width: "14%" }]}>Tarih</Text>
          <Text style={[styles.headerCell, { width: "16%" }]}>Aylık Tutar</Text>
          <Text style={[styles.headerCell, { width: "14%" }]}>Getiri</Text>
          <Text style={[styles.headerCell, { width: "18%" }]}>Toplam Birikim</Text>
          <Text style={[styles.headerCell, { width: "16%" }]}>Toplam</Text>
          <Text style={[styles.headerCell, { width: "16%" }]}>İlerleme</Text>
        </View>

        {rows.map((row, index) => (
          <View
            key={row.monthIndex}
            style={index % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row}
            wrap={false}
          >
            <View style={{ width: "6%" }}>
              <View style={styles.checkbox} />
            </View>
            <View style={{ width: "14%" }}>
              <Text style={styles.monthNumber}>Ay {row.monthIndex}</Text>
              <Text style={styles.monthLabel}>{row.label}</Text>
            </View>
            <View style={{ width: "16%" }}>
              <Text style={styles.valueText}>{formatCurrency(row.plannedContribution)}</Text>
            </View>
            <View style={{ width: "14%" }}>
              <Text style={styles.valueText}>{formatCurrency(row.profit)}</Text>
            </View>
            <View style={{ width: "18%" }}>
              <Text style={styles.valueText}>{formatCurrency(row.cumulativeContributions)}</Text>
            </View>
            <View style={{ width: "16%" }}>
              <Text style={styles.valueText}>{formatCurrency(row.projectedBalance)}</Text>
            </View>
            <View style={{ width: "16%" }}>
              <Text style={styles.valueText}>{formatPercent(row.progressPercent)}</Text>
              <View style={styles.progressOuter}>
                <View
                  style={[
                    styles.progressInner,
                    { width: progressWidth(row.progressPercent) },
                  ]}
                />
              </View>
              {row.milestoneLabel ? (
                <Text style={styles.milestone}>{row.milestoneLabel}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SavingsChecklistDocument({
  rows,
  summary,
}: {
  rows: MonthlyPlanItem[];
  summary: ChecklistSummary;
}) {
  const groups = chunkRows(rows, 12);

  return (
    <Document title="Aylık Takip Planı" author="Finans Pusula">
      {groups.map((group, index) => (
        <Page key={`${group[0]?.monthIndex}-${index}`} size="A4" style={styles.page}>
          <Header summary={summary} quote={getQuoteForPage(index)} compact={index > 0} />
          <ChecklistTable rows={group} groupIndex={index} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              <Text style={styles.footerStrong}>Kısa bir hatırlatma: </Text>
              Büyük hedefler tek seferde değil, düzenli adımlarla gerçekleşir.
              Adımlar küçük olsa bile yönün net olduğunda ilerleme devam eder.
            </Text>
            {summary.disclaimer ? (
              <Text style={[styles.footerText, { marginTop: 6 }]}>
                <Text style={styles.footerStrong}>Not: </Text>
                {summary.disclaimer}
              </Text>
            ) : null}
          </View>
        </Page>
      ))}
    </Document>
  );
}

export function SavingsChecklistPdfButton({
  rows,
  summary,
  fileName,
}: SavingsChecklistPdfProps) {
  const isClient = useIsClient();

  if (!isClient || rows.length === 0) {
    return (
      <button className={cn(buttonVariants({ variant: "default" }))} disabled>
        <Download data-icon="inline-start" />
        PDF indir
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<SavingsChecklistDocument rows={rows} summary={summary} />}
      fileName={fileName}
      className={cn(buttonVariants({ variant: "default" }))}
    >
      {({ loading }) => (
        <>
          <Download data-icon="inline-start" />
          {loading ? "PDF hazırlanıyor" : "PDF indir"}
        </>
      )}
    </PDFDownloadLink>
  );
}
