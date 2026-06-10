import type { Metadata } from "next";

import { CalculatorLayout } from "@/components/CalculatorLayout";
import { GrowthCalculator } from "@/components/calculators/GrowthCalculator";

export const metadata: Metadata = {
  title: "Bileşik Faiz Hesaplama",
  description:
    "Başlangıç tutarı, aylık ekleme ve yıllık oranla birikimin zaman içinde nasıl büyüdüğünü görebilirsin.",
};

export default function CompoundInterestPage() {
  return (
    <CalculatorLayout
      title="Bileşik Faiz Hesaplama"
      description="Başlangıç tutarı, aylık ekleme ve yıllık orana göre birikiminin zaman içinde nasıl büyüdüğünü gör."
      note="Bugünün parasıyla değer, seçtiğin enflasyon varsayımına göre yaklaşık olarak hesaplanır."
    >
      <GrowthCalculator kind="compound" />
    </CalculatorLayout>
  );
}
