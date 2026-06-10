import type { Metadata } from "next";

import { CalculatorLayout } from "@/components/CalculatorLayout";
import { GrowthCalculator } from "@/components/calculators/GrowthCalculator";

export const metadata: Metadata = {
  title: "Basit Faiz Hesaplama",
  description:
    "Ana para ve düzenli eklemeler üzerinden basit faizle oluşan toplam tutarı görebilirsin.",
  alternates: {
    canonical: "/calculators/simple-interest",
  },
  openGraph: {
    title: "Basit Faiz Hesaplama | Finans Pusula",
    description:
      "Ana para ve düzenli eklemeler üzerinden basit faizle oluşan toplam tutarı gör.",
    url: "/calculators/simple-interest",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Basit Faiz Hesaplama | Finans Pusula",
    description:
      "Ana para ve düzenli eklemeler üzerinden basit faizle oluşan toplam tutarı gör.",
    images: ["/opengraph-image"],
  },
};

export default function SimpleInterestPage() {
  return (
    <CalculatorLayout
      title="Basit Faiz Hesaplama"
      description="Ana para üzerinden basit faiz kazancını ve toplam tutarı hızlıca hesapla."
      note="Basit faiz hesabında her aylık ekleme, kalan süre kadar ayrı ayrı faiz kazanır."
    >
      <GrowthCalculator kind="simple" />
    </CalculatorLayout>
  );
}
