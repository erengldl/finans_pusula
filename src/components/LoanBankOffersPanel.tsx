"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTimeLabel, formatPercent } from "@/lib/formatters";
import type { LoanBankOffersResponse } from "@/lib/scenario-engine";
import type { LoanFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";

type LoanBankOffersPanelProps = {
  values: LoanFormValues;
};

export function LoanBankOffersPanel({ values }: LoanBankOffersPanelProps) {
  const [data, setData] = useState<LoanBankOffersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestBody = JSON.stringify({ values });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        const response = await fetch("/api/forecast/loan-banks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Banka karşılaştırması yüklenemedi.");
        }

        const payload = (await response.json()) as LoanBankOffersResponse;
        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Banka karşılaştırması yüklenemedi.",
        );
      }
    }

    void load();

    return () => controller.abort();
  }, [requestBody]);

  function getOfferModeLabel(
    mode: LoanBankOffersResponse["offers"][number]["integrationMode"],
    sourceLabel: string,
  ) {
    if (sourceLabel.toLowerCase().includes("seed")) {
      return "Örnek";
    }

    return mode === "partner_feed" ? "Canlı partner" : "Snapshot";
  }

  function getOfferCautionLabel(mode: LoanBankOffersResponse["offers"][number]["integrationMode"], sourceLabel: string) {
    if (mode === "partner_feed") {
      return "Banka partner feed'iyle gelen güncel teklif.";
    }

    if (sourceLabel.toLowerCase().includes("seed")) {
      return "Örnek veri kullanılıyor; banka kanalında son teklif farklı olabilir.";
    }

    return "Snapshot teklif; son oran banka kanalında farklılaşabilir.";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banka karşılaştırması</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-lg border border-negative/20 bg-card p-4 text-sm text-negative">
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <p className="text-sm leading-6 text-muted-foreground">
              {data.liveIntegrationStatus}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              Canlı olmayan kartlarda oran ve masraf örnek olabilir; başvuru öncesi banka sayfasını doğrula.
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              {data.offers.map((offer) => {
                const isBestOffer = offer.bankId === data.bestOfferId;
                const modeLabel = getOfferModeLabel(offer.integrationMode, offer.sourceLabel);
                const cautionLabel = getOfferCautionLabel(offer.integrationMode, offer.sourceLabel);

                return (
                  <div
                    key={offer.bankId}
                    className={cn(
                      "rounded-lg border border-border bg-background p-4",
                      isBestOffer && "border-foreground/15 bg-muted",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded-lg border border-border bg-white px-3">
                          <Image
                            src={offer.logoPath}
                            alt={`${offer.bankName} logosu`}
                            width={112}
                            height={32}
                            className="h-8 w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{offer.bankName}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
                            <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
                              {modeLabel}
                            </span>
                            {isBestOffer ? (
                              <span className="rounded-full border border-positive/20 bg-positive/10 px-2 py-1 text-positive">
                                En iyi teklif
                              </span>
                            ) : null}
                            {offer.supportsOnlineApplication ? (
                              <span className="rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                                Canlı başvuru
                              </span>
                            ) : (
                              <span className="rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                                Yönlendirme
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {formatPercent(offer.monthlyRate)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Aylık faiz
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Aylık ödeme</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {formatCurrency(offer.monthlyPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Toplam maliyet</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {formatCurrency(offer.totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Masraf / sigorta</p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {formatCurrency(offer.extraFees)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">En iyi teklife fark</p>
                        <p
                          className={`mt-1 text-base font-semibold ${
                            offer.differenceFromBest <= 0
                              ? "text-positive"
                              : "text-negative"
                          }`}
                        >
                          {offer.differenceFromBest <= 0
                            ? "En iyi"
                            : formatCurrency(offer.differenceFromBest)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {offer.note}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {cautionLabel}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Güncelleme: {formatDateTimeLabel(offer.updatedAt)}
                    </p>

                    <div className="mt-4 flex justify-center">
                      <Button asChild className="min-w-44">
                        <a
                          href={offer.supportsOnlineApplication ? offer.applicationUrl : offer.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() =>
                            track("bank_offer_click", {
                              bank: offer.shortName,
                              mode: offer.integrationMode,
                            })
                          }
                        >
                          Banka sayfasına git
                          <ArrowUpRight className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Hazırlanıyor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
