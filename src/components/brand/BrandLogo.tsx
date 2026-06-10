import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  title?: string;
};

export function BrandLogo({
  className,
  iconClassName,
  subtitle,
  subtitleClassName,
  title = "Finans Pusula",
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark className={cn("size-11", iconClassName)} title="" />
      <div className="flex min-w-0 flex-col">
        <span className="font-display truncate text-base font-semibold text-foreground">
          {title}
        </span>
        {subtitle ? (
          <span
            className={cn(
              "truncate text-xs font-medium text-muted-foreground",
              subtitleClassName,
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
