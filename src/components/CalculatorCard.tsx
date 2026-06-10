import Link from "next/link";
import type { LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
};

export function CalculatorCard({
  href,
  title,
  description,
  icon: Icon,
}: CalculatorCardProps) {
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
          <Link href={href}>Aracı aç</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
