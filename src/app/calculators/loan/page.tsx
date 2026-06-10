import type { Metadata } from "next";

import { CalculatorLayout } from "@/components/CalculatorLayout";
import { LoanCalculator } from "@/components/calculators/LoanCalculator";

export const metadata: Metadata = {
  title: "Kredi Planı",
  description:
    "İhtiyaç, taşıt ve konut kredisi için aylık ödemeyi, toplam maliyeti ve banka karşılaştırmasını görebilirsin.",
};

export default function LoanPage() {
  return (
    <CalculatorLayout
      title="Kredi Planı"
      description="İhtiyaç, taşıt ve konut kredisi için aylık ödemeyi, toplam maliyeti ve banka farklarını kolayca gör."
      note="Veri durumu sayfa içinde gösterilir. EVDS ve partner feed bağlı olmayan bankalarda seed snapshot kullanılabilir; kesin teklif yine banka kanalında netleşir."
    >
      <LoanCalculator />
    </CalculatorLayout>
  );
}
