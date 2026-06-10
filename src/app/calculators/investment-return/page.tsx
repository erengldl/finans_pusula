import type { Metadata } from "next";

import { CalculatorLayout } from "@/components/CalculatorLayout";
import { GrowthCalculator } from "@/components/calculators/GrowthCalculator";

export const metadata: Metadata = {
  title: "Yatırım Getirisi Hesaplama",
  description:
    "Aylık yatırımların farklı getiri ve enflasyon varsayımlarıyla gelecekte nereye ulaşabileceğini görebilirsin.",
  alternates: {
    canonical: "/calculators/investment-return",
  },
  openGraph: {
    title: "Yatırım Getirisi Hesaplama | Finans Pusula",
    description:
      "Aylık yatırımların farklı getiri ve enflasyon varsayımlarıyla gelecekte nereye ulaşabileceğini gör.",
    url: "/calculators/investment-return",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yatırım Getirisi Hesaplama | Finans Pusula",
    description:
      "Aylık yatırımların farklı getiri ve enflasyon varsayımlarıyla gelecekte nereye ulaşabileceğini gör.",
    images: ["/opengraph-image"],
  },
};

export default function InvestmentReturnPage() {
  return (
    <CalculatorLayout
      title="Yatırım Getirisi Hesaplama"
      description="Aylık yatırım tutarını ve yıllık getiri varsayımını girerek planı zaman içinde karşılaştır."
      note="Bugünün parasıyla değer, seçtiğin enflasyon varsayımına göre yaklaşık olarak hesaplanır."
    >
      <GrowthCalculator kind="investment" />
    </CalculatorLayout>
  );
}
