"use client";

import Link from "next/link";
import {
  Banknote,
  ChartNoAxesCombined,
  Landmark,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { track } from "@vercel/analytics";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CalculatorCardProps = {
  href: string;
  title: string;
  description?: string;
  iconKey: CalculatorIconKey;
};

type CalculatorIconKey = "percent" | "banknote" | "chart" | "landmark";

const iconMap: Record<CalculatorIconKey, LucideIcon> = {
  percent: Percent,
  banknote: Banknote,
  chart: ChartNoAxesCombined,
  landmark: Landmark,
};

export function CalculatorCard({
  href,
  title,
  description,
  iconKey,
}: CalculatorCardProps) {
  const Icon = iconMap[iconKey];

  return (
    <Card className="flex h-full flex-col transition-colors hover:border-foreground/15">
      <CardHeader>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon data-icon="inline-start" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href} onClick={() => track("calculator_open", { calculator: title, href })}>
            Aracı aç
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
