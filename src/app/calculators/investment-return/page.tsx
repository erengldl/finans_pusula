import type { Metadata } from "next";

import { CalculatorLayout } from "@/components/CalculatorLayout";
import { GrowthCalculator } from "@/components/calculators/GrowthCalculator";

export const metadata: Metadata = {
  title: "Yatırım Getirisi Hesaplama",
  description:
    "Aylık yatırımların farklı getiri ve enflasyon varsayımlarıyla gelecekte nereye ulaşabileceğini görebilirsin.",
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
