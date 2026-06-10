import { cn } from "@/lib/utils";

type ResultCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "negative";
};

export function ResultCard({
  label,
  value,
  helper,
  tone = "default",
}: ResultCardProps) {
  return (
    <article className="min-w-0 rounded-[18px] border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-[1.75rem] font-semibold leading-tight text-foreground [overflow-wrap:anywhere] sm:text-[1.9rem]",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-negative",
          )}
        >
          {value}
        </p>
        {helper ? <p className="text-xs leading-5 text-muted-foreground">{helper}</p> : null}
      </div>
    </article>
  );
}
