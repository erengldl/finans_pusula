import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({
  className,
  title = "Finans Pusula logosu",
}: BrandMarkProps) {
  const decorative = !title;

  return (
    <span
      aria-hidden={decorative}
      className={cn("relative inline-flex aspect-square shrink-0", className)}
    >
      <Image
        src="/finans-pusula-logo.png"
        alt={title}
        fill
        sizes="(max-width: 640px) 24px, 44px"
        className="object-contain"
        priority
      />
    </span>
  );
}
