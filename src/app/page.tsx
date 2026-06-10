import {
  Banknote,
  ChartNoAxesCombined,
  Database,
  Landmark,
  Percent,
} from "lucide-react";
import Link from "next/link";

import { CalculatorCard } from "@/components/CalculatorCard";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const calculators = [
  {
    href: "/calculators/compound-interest",
    title: "Faizli Birikim",
    description: "Düzenli birikimin zaman içinde nasıl büyüdüğünü gör.",
    icon: Percent,
  },
  {
    href: "/calculators/simple-interest",
    title: "Basit Faiz Hesaplama",
    description: "Ana para üzerinden sade ve hızlı faiz hesabı yap.",
    icon: Banknote,
  },
  {
    href: "/calculators/investment-return",
    title: "Yatırım Planı",
    description: "Aylık yatırımın farklı getiri varsayımlarında nereye gittiğini karşılaştır.",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/calculators/loan",
    title: "Kredi Planı",
    description: "Aylık ödeme, toplam maliyet ve faiz yükünü tek ekranda gör.",
    icon: Landmark,
  },
];

const quickSteps = [
  {
    title: "Araç seç",
    description: "Kredi, birikim veya yatırım modülünü aç.",
  },
  {
    title: "Bilgileri gir",
    description: "Tutar, oran ve süre gibi temel veriler yeterli.",
  },
  {
    title: "Sonucu gör",
    description: "Kartlar ve grafiklerle sonucu hemen yorumla.",
  },
];

const dataCards = [
  {
    title: "Örnek kredi oranları",
    description: "Karşılaştırma için referans aylık oranlar kullanılır.",
  },
  {
    title: "Yatırım senaryoları",
    description: "Farklı getiri bantlarıyla planın dayanıklılığını gör.",
  },
  {
    title: "Enflasyon varsayımları",
    description: "Bugünün parasıyla değeri sade biçimde karşılaştır.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
              <BrandMark className="size-5" title="" />
              <p className="text-sm font-semibold text-foreground">Finans Pusula</p>
            </div>
            <h1 className="font-display text-[clamp(2.4rem,8vw,4.2rem)] font-semibold leading-[0.98] text-foreground sm:text-5xl">
              Kredini, birikimini ve yatırım planını daha net gör.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Kredi, birikim ve yatırım hesabını tek ekranda hızlıca yap.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/calculators/loan">Kredi planını aç</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/calculators/investment-return">Yatırım planını aç</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-[20px] border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Nasıl çalışır</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {quickSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-semibold text-foreground">Hesaplayıcılar</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Sadece gerekli alanları gösteren, hızlı okunur araçlar.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {calculators.map((calculator) => (
              <CalculatorCard key={calculator.href} {...calculator} />
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
              <Database className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Kullanılan örnek veriler</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Sonuçları yorumlamayı kolaylaştıran sade referans katmanı.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {dataCards.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
