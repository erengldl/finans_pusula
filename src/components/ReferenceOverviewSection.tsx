import {
  ArrowUpRight,
  DatabaseZap,
  Landmark,
  ShieldAlert,
  Thermometer,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTimeLabel, formatPercent } from "@/lib/formatters";
import { getReferenceOverview } from "@/lib/reference-data";

export function ReferenceOverviewSection() {
  const overview = getReferenceOverview();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-semibold text-primary">Örnek veri merkezi</p>
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Hesaplamalarda kullanılan örnek oranları ve varsayımları gör
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          Bu bölümde kredi, yatırım ve enflasyon hesaplarında kullanılan örnek
          varsayımları görürsün. Amaç, sonucu tek rakam yerine bir aralık içinde
          değerlendirmen için yardımcı olmaktır.
        </p>
      </div>

      <Card className="border-primary/20 bg-secondary/40">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <DatabaseZap className="size-3.5" />
              {overview.snapshotLabel}
            </span>
            <span className="text-sm text-muted-foreground">
              Son güncelleme: {formatDateTimeLabel(overview.generatedAt)}
            </span>
          </div>
          <CardTitle>Veriler nasıl kullanılıyor?</CardTitle>
          <CardDescription>{overview.liveIntegrationStatus}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Örnek kredi oranları
            </CardTitle>
            <CardDescription>
              Kredi hesabını hızlı başlatmak için kullanabileceğin örnek aylık oranlar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.loanRates.map((item) => (
              <div
                key={item.loanType}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {formatPercent(item.averageMonthlyRate)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Tipik masraf: {new Intl.NumberFormat("tr-TR").format(item.typicalFees)} TL</span>
                  <span>{item.sourceLabel}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              Örnek yatırım senaryoları
            </CardTitle>
            <CardDescription>
              Getiri ve hedef süresi karşılaştırmalarında kullanılabilecek örnek seçenekler.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.investments.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {formatPercent(item.annualReturnAssumption)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{item.category}</span>
                  <span>Risk: {item.riskLevel === "low" ? "Düşük" : item.riskLevel === "medium" ? "Orta" : "Yüksek"}</span>
                  <span>{item.sourceLabel}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="size-5 text-primary" />
              Örnek enflasyon senaryoları
            </CardTitle>
            <CardDescription>
              Sonucu bugünün parasıyla okumak için kullanabileceğin örnek yıllık enflasyon bantları.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.inflationPresets.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {formatPercent(item.annualRate)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Band:{" "}
                    {item.tone === "low"
                      ? "Düşük"
                      : item.tone === "baseline"
                        ? "Baz"
                        : "Yüksek"}
                  </span>
                  <span>{item.sourceLabel}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bu sonuçları nasıl okumalı?</CardTitle>
            <CardDescription>
              Uygulama hesaplamayı net tutar; bu veriler sadece karşılaştırma katmanı ekler.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
            <p>{overview.methodology.loan}</p>
            <p>{overview.methodology.investment}</p>
            <p>{overview.methodology.inflation}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canlı veri açıldığında izlenecek kaynaklar</CardTitle>
            <CardDescription>
              Gelecekte otomatik veri akışı için baz alınacak resmi veya kurumsal kaynaklar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {overview.providers.map((provider) => (
              <a
                key={provider.id}
                href={provider.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{provider.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{provider.coverage}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {provider.note}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
