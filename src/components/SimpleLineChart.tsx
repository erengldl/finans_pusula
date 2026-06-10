"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import { useIsClient } from "@/lib/use-is-client";

type ChartPoint = {
  year?: number;
  month?: number;
  totalValue: number;
  totalContributions?: number;
  realValue?: number;
  target?: number;
};

type SimpleLineChartProps = {
  data: ChartPoint[];
  showRealValue?: boolean;
  showContributions?: boolean;
  showTarget?: boolean;
  primaryLabel?: string;
  targetLabel?: string;
  visualTone?: "growth" | "investment";
  xAxisKey?: "year" | "month";
};

const chartPalettes = {
  growth: {
    primary: "#16A34A",
    real: "#0F766E",
    contributions: "#1D4ED8",
    target: "#D97706",
  },
  investment: {
    primary: "#1D4ED8",
    real: "#16A34A",
    contributions: "#64748B",
    target: "#7C3AED",
  },
} as const;

export function SimpleLineChart({
  data,
  showRealValue,
  showContributions,
  showTarget,
  primaryLabel = "Toplam değer",
  targetLabel = "Hedef",
  visualTone = "growth",
  xAxisKey = "year",
}: SimpleLineChartProps) {
  const isClient = useIsClient();
  const palette = chartPalettes[visualTone];

  if (!isClient) {
    return <div className="h-80 w-full rounded-lg bg-muted" aria-hidden />;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) =>
              xAxisKey === "month" ? `${value}. ay` : `${value}. yıl`
            }
          />
          <YAxis
            width={72}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            labelFormatter={(label) =>
              xAxisKey === "month" ? `${label}. ay` : `${label}. yıl`
            }
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E5E7EB",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(17, 24, 39, 0.08)",
            }}
          />
          <Line
            type="monotone"
            dataKey="totalValue"
            name={primaryLabel}
            stroke={palette.primary}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, fill: palette.primary }}
          />
          {showRealValue ? (
            <Line
              type="monotone"
              dataKey="realValue"
              name="Bugünün parasıyla"
              stroke={palette.real}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          ) : null}
          {showContributions ? (
            <Line
              type="monotone"
              dataKey="totalContributions"
              name="Toplam yatırılan para"
              stroke={palette.contributions}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
          ) : null}
          {showTarget ? (
            <Line
              type="monotone"
              dataKey="target"
              name={targetLabel}
              stroke={palette.target}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
