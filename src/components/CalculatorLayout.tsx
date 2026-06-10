import { SiteHeader } from "@/components/SiteHeader";

type CalculatorLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  note?: string;
};

export function CalculatorLayout({
  title,
  description,
  children,
  note,
}: CalculatorLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex max-w-3xl flex-col gap-2.5">
          <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-semibold leading-[1.02] text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          {note ? <p className="max-w-2xl text-xs leading-5 text-muted-foreground">{note}</p> : null}
        </div>
        {children}
      </section>
    </main>
  );
}
