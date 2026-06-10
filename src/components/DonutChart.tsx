"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/formatters";
import { useIsClient } from "@/lib/use-is-client";

const growthFallbackColors = [
  "#1D4ED8",
  "#16A34A",
  "#D97706",
  "#7C3AED",
  "#0F766E",
];

const loanFallbackColors = [
  "#1D4ED8",
  "#DC2626",
  "#D97706",
  "#475569",
];

function getGrowthSliceColor(name: string, index: number) {
  const normalized = name.toLocaleLowerCase("tr-TR");

  if (
    normalized.includes("getiri") ||
    normalized.includes("kazan") ||
    normalized.includes("kâr") ||
    normalized.includes("kar") ||
    normalized.includes("faiz")
  ) {
    return "#16A34A";
  }

  if (
    normalized.includes("başlangıç") ||
    normalized.includes("baslangic") ||
    normalized.includes("mevcut")
  ) {
    return "#1D4ED8";
  }

  if (
    normalized.includes("aylık katkı") ||
    normalized.includes("aylik katkı") ||
    normalized.includes("aylik katki") ||
    normalized.includes("katkı") ||
    normalized.includes("katki") ||
    normalized.includes("yatırılan") ||
    normalized.includes("yatirilan") ||
    normalized.includes("biriken")
  ) {
    return "#0F766E";
  }

  if (
    normalized.includes("hedef") ||
    normalized.includes("nominal") ||
    normalized.includes("reel")
  ) {
    return "#7C3AED";
  }

  return growthFallbackColors[index % growthFallbackColors.length];
}

function getLoanSliceColor(name: string, index: number) {
  const normalized = name.toLocaleLowerCase("tr-TR");

  if (normalized.includes("anapara")) {
    return "#1D4ED8";
  }

  if (normalized.includes("faiz")) {
    return "#DC2626";
  }

  if (
    normalized.includes("masraf") ||
    normalized.includes("sigorta") ||
    normalized.includes("dosya")
  ) {
    return "#D97706";
  }

  if (normalized.includes("maliyet")) {
    return "#475569";
  }

  return loanFallbackColors[index % loanFallbackColors.length];
}

type DonutChartProps = {
  data: Array<{ name: string; value: number }>;
  surface?: "growth" | "loan";
};

export function DonutChart({
  data,
  surface = "growth",
}: DonutChartProps) {
  const isClient = useIsClient();
  const getColor = surface === "loan" ? getLoanSliceColor : getGrowthSliceColor;

  if (!isClient) {
    return <div className="h-72 w-full rounded-lg bg-muted" aria-hidden />;
  }

  if (!data.length) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
        Grafikte gösterilecek veri henüz yok.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="84%"
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={getColor(entry.name, index)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E5E7EB",
                borderRadius: 10,
                boxShadow: "0 12px 32px rgba(17, 24, 39, 0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: getColor(item.name, index) }}
              />
              {item.name}
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
