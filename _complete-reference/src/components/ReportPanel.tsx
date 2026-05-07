import { BarChart3 } from "lucide-react";
import { FindingsText } from "@/components/FindingsText";
import { MetricCard } from "@/components/MetricCard";
import { PostureTypeBadge } from "@/components/PostureTypeBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvalResult } from "@/types";

type ReportPanelProps = {
  result: EvalResult | null;
};

export function ReportPanel({ result }: ReportPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-900" aria-hidden="true" />
              レポート
            </CardTitle>
            <CardDescription>
              Kendall姿勢評価を参考に、角度と左右差を仮閾値で整理します。
            </CardDescription>
          </div>
          {result ? <PostureTypeBadge postureType={result.postureType} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3">
              {result.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
            <FindingsText findings={result.findings} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
            検出が完了すると、姿勢タイプ、指標カード、自動生成所見がここに表示されます。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
