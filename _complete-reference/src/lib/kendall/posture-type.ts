import type { EvalMetric, PostureType } from "@/types";

function byId(metrics: EvalMetric[], id: string) {
  return metrics.find((metric) => metric.id === id);
}

function severityWeight(metric: EvalMetric | undefined): number {
  if (!metric) return 0;
  if (metric.severity === "severe") return 2;
  if (metric.severity === "mild") return 1;
  return 0;
}

function dirMatch(metric: EvalMetric | undefined, direction: EvalMetric["direction"]): number {
  if (!metric) return 0;
  if (metric.severity === "normal") return 0;
  return metric.direction === direction ? severityWeight(metric) : 0;
}

export function classifyPostureType(metrics: EvalMetric[]): PostureType {
  if (metrics.every((metric) => metric.severity === "normal")) {
    return "ideal";
  }

  const head = byId(metrics, "forwardHead");
  const trunk = byId(metrics, "trunkLean");
  const pelvis = byId(metrics, "pelvicTilt");
  const knee = byId(metrics, "kneeExtension");
  const shoulder = byId(metrics, "forwardShoulder");

  // 各類型のスコア。最も近いタイプを返すことで「分類保留」を避ける。
  // TODO: 要臨床調整（重み配分は仮値）
  const scores: Record<Exclude<PostureType, "ideal" | "unclassified">, number> = {
    "kyphosis-lordosis":
      dirMatch(head, "forward") +
      dirMatch(shoulder, "forward") +
      dirMatch(trunk, "forward") +
      dirMatch(pelvis, "anterior"),
    lordosis:
      dirMatch(pelvis, "anterior") * 1.5 +
      (head?.severity === "normal" ? 0.5 : 0) +
      (shoulder?.severity === "normal" ? 0.5 : 0),
    "flat-back":
      dirMatch(pelvis, "posterior") * 1.5 +
      (knee && knee.direction !== "hyperextension" ? 0.5 : 0) +
      (trunk && trunk.direction !== "forward" ? 0.5 : 0),
    "sway-back":
      dirMatch(trunk, "backward") +
      dirMatch(pelvis, "anterior") * 0.5 +
      dirMatch(knee, "hyperextension") +
      dirMatch(head, "forward") * 0.5,
  };

  const ranked = (Object.entries(scores) as [Exclude<PostureType, "ideal" | "unclassified">, number][])
    .sort((a, b) => b[1] - a[1]);

  const [topType, topScore] = ranked[0];
  if (topScore <= 0) {
    // 全指標が逸脱しているのに方向が分散しているケース。最大severityを基準に判定。
    const severeOrMild = metrics.find((m) => m.severity !== "normal");
    if (severeOrMild?.direction === "anterior") return "lordosis";
    if (severeOrMild?.direction === "posterior") return "flat-back";
    if (severeOrMild?.direction === "backward") return "sway-back";
    return "kyphosis-lordosis";
  }

  return topType;
}
