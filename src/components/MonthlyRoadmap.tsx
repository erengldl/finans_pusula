"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  SavingsChecklistPdfButton,
  type ChecklistSummary,
} from "@/components/SavingsChecklistPdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonthlyPlanItem } from "@/lib/finance";
import {
  formatCurrency,
  formatDurationFromMonths,
  formatPercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

type MonthlyRoadmapProps = {
  rows: MonthlyPlanItem[];
  summary: ChecklistSummary;
  isOpen: boolean;
  onToggle: () => void;
  includeInflation: boolean;
  pdfFileName: string;
  isTargetMode?: boolean;
};

function groupRowsByYear(rows: MonthlyPlanItem[]) {
  return rows.reduce<Array<{ yearNumber: number; calendarYear: number; rows: MonthlyPlanItem[] }>>(
    (groups, row) => {
      const yearNumber = Math.ceil(row.monthIndex / 12);
      const existing = groups.find(
        (group) => group.yearNumber === yearNumber && group.calendarYear === row.calendarYear,
      );

      if (existing) {
        existing.rows.push(row);
      } else {
        groups.push({ yearNumber, calendarYear: row.calendarYear, rows: [row] });
      }

      return groups;
    },
    [],
  );
}

function getNextMilestone(rows: MonthlyPlanItem[]) {
  const milestoneRow = rows.find((row) => row.milestoneLabel);

  if (!milestoneRow) {
    return "Düzenli ilerleme";
  }

  return `${milestoneRow.milestoneLabel} - ${formatDurationFromMonths(milestoneRow.monthIndex)}`;
}

function RoadmapMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RoadmapValue({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md bg-background/70 p-3">
      <p className="text-xs leading-5 text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 break-words text-sm font-semibold leading-5 tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MonthlyRoadmapRow({
  row,
  includeInflation,
  isTargetMode,
}: {
  row: MonthlyPlanItem;
  includeInflation: boolean;
  isTargetMode?: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
              Ay {row.monthIndex}
            </span>
            {row.milestoneLabel ? (
              <span className="rounded-md border border-positive/30 bg-card px-2 py-1 text-xs font-medium text-positive">
                {row.milestoneLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{row.label}</p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
          <Check data-icon="inline-start" />
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <RoadmapValue
          label="Bu ay ayrılacak tutar"
          value={formatCurrency(row.plannedContribution)}
        />
        <RoadmapValue
          label="Toplam biriken"
          value={formatCurrency(row.cumulativeContributions)}
        />
        <RoadmapValue
          label="Hedefe kalan"
          value={formatCurrency(row.remainingToTarget)}
          muted
        />
        <RoadmapValue
          label="Tahmini toplam"
          value={formatCurrency(row.projectedBalance)}
        />
        {includeInflation ? (
          <RoadmapValue
            label="Bugünün parasıyla"
            value={formatCurrency(row.projectedRealBalance ?? row.projectedBalance)}
            muted
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="h-2 rounded-full bg-muted">
          <div
            className={cn("h-2 rounded-full bg-positive")}
            style={{ width: `${Math.min(100, Math.max(0, row.progressPercent))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          İlerleme: {formatPercent(row.progressPercent)}
          {isTargetMode ? "" : " / plan sonu"}
        </p>
      </div>
    </article>
  );
}

export function MonthlyRoadmap({
  rows,
  summary,
  isOpen,
  onToggle,
  includeInflation,
  pdfFileName,
  isTargetMode,
}: MonthlyRoadmapProps) {
  const visibleRows = rows.filter((row) => row.monthIndex > 0);
  const groups = groupRowsByYear(visibleRows);
  const firstMonth = visibleRows[0];
  const nextMilestone = getNextMilestone(visibleRows);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Aylık takip planı</CardTitle>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SavingsChecklistPdfButton
              rows={visibleRows}
              summary={summary}
              fileName={pdfFileName}
            />
            <Button type="button" variant="outline" onClick={onToggle}>
              {isOpen ? "Detayı kapat" : "Detayı aç"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen ? (
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 md:grid-cols-4">
            <RoadmapMetric label="Bu ayki plan" value={formatCurrency(firstMonth?.plannedContribution ?? 0)} />
            <RoadmapMetric label="Sıradaki eşik" value={nextMilestone} />
            <RoadmapMetric
              label={isTargetMode ? "Tahmini hedef süresi" : "Plan süresi"}
              value={summary.durationLabel}
            />
            <RoadmapMetric
              label="Planın geldiği nokta"
              value={formatPercent(firstMonth?.progressPercent ?? 0)}
            />
          </div>

          <div className="flex flex-col gap-4">
            {groups.map((group, index) => (
              <details
                key={`${group.yearNumber}-${group.calendarYear}`}
                className="rounded-lg border border-border bg-background"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <span className="font-semibold text-foreground">
                    {group.yearNumber}. Yıl - {group.calendarYear}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {group.rows.length} ay
                    <ChevronDown data-icon="inline-start" />
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-border p-3">
                  {group.rows.map((row) => (
                    <MonthlyRoadmapRow
                      key={row.monthIndex}
                      row={row}
                      includeInflation={includeInflation}
                      isTargetMode={isTargetMode}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>

        </CardContent>
      ) : null}
    </Card>
  );
}
