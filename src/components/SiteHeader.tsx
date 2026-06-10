import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/calculators/compound-interest", label: "Faizli Birikim" },
  { href: "/calculators/simple-interest", label: "Basit Faiz" },
  { href: "/calculators/investment-return", label: "Yatırım" },
  { href: "/calculators/loan", label: "Kredi" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Finans Pusula ana sayfa" className="shrink-0">
          <BrandLogo
            subtitle="Kredini ve birikimini sayıyla planla"
            iconClassName="size-9"
            subtitleClassName="hidden sm:block"
          />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
