import type { EvalMetric, PostureType, ViewType } from "@/types";

const postureTypeLabels: Record<PostureType, string> = {
  ideal: "理想アライメントに近い傾向",
  "kyphosis-lordosis": "後弯前弯型に近い傾向",
  "flat-back": "フラットバック型に近い傾向",
  "sway-back": "スウェイバック型に近い傾向",
  lordosis: "前弯強調型に近い傾向",
  unclassified: "分類保留",
};

const severityLabels = {
  normal: "仮閾値内",
  mild: "軽度",
  severe: "明らか",
} as const;

function viewLabel(view: ViewType) {
  return view.startsWith("sagittal") ? "矢状面" : "前額面";
}

export function generateFindings(
  metrics: EvalMetric[],
  postureType: PostureType | null,
  view: ViewType,
): string[] {
  const findings: string[] = [];
  const abnormalMetrics = metrics.filter((metric) => metric.severity !== "normal");

  if (postureType) {
    findings.push(
      `${viewLabel(view)}では、姿勢タイプは「${postureTypeLabels[postureType]}」として参考表示しています。`,
    );
  } else {
    findings.push(`${viewLabel(view)}の左右差とアライメント指標を参考表示しています。`);
  }

  if (abnormalMetrics.length === 0) {
    findings.push("主要指標は、現在の仮閾値では大きな逸脱が目立ちません。");
    findings.push("撮影条件と触診所見を合わせて、最終的な評価を行ってください。");
    return findings;
  }

  abnormalMetrics.slice(0, 5).forEach((metric) => {
    findings.push(
      `${metric.label}は${severityLabels[metric.severity]}の逸脱として表示され、${metric.summary}`,
    );
  });
  findings.push("本結果は2D推定に基づく参考情報です。回旋、服装、遮蔽の影響を確認してください。");

  return findings;
}
