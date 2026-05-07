import { Card, CardContent } from "@/components/ui/card";
import type { EvalMetric } from "@/types";

type MetricCardProps = {
  metric: EvalMetric;
};

const severityLabel = {
  normal: "仮閾値内",
  mild: "軽度",
  severe: "明らか",
} as const;

const severityDotClass = {
  normal: "bg-emerald-500",
  mild: "bg-orange-500",
  severe: "bg-red-500",
} as const;

const severityTextClass = {
  normal: "text-emerald-700",
  mild: "text-orange-700",
  severe: "text-red-700",
} as const;

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDotClass[metric.severity]}`}
            aria-hidden="true"
          />
          <div className="text-sm font-semibold text-slate-950" data-nowrap>
            {metric.label}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-slate-950" data-nowrap>
            {metric.displayValue}
          </span>
          <span
            className={`text-xs font-medium ${severityTextClass[metric.severity]}`}
            data-nowrap
          >
            {severityLabel[metric.severity]}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{metric.summary}</p>
      </CardContent>
    </Card>
  );
}
