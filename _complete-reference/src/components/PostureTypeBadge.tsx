import { Badge } from "@/components/ui/badge";
import type { PostureType } from "@/types";

type PostureTypeBadgeProps = {
  postureType: PostureType | null;
};

const labels: Record<PostureType, string> = {
  ideal: "理想アライメントに近い傾向",
  "kyphosis-lordosis": "後弯前弯型に近い傾向",
  "flat-back": "フラットバック型に近い傾向",
  "sway-back": "スウェイバック型に近い傾向",
  lordosis: "前弯強調型に近い傾向",
  unclassified: "複合パターン",
};

export function PostureTypeBadge({ postureType }: PostureTypeBadgeProps) {
  if (!postureType) {
    return <Badge variant="outline">前額面評価</Badge>;
  }

  const variant = postureType === "ideal" ? "success" : postureType === "unclassified" ? "outline" : "warning";
  return <Badge variant={variant}>{labels[postureType]}</Badge>;
}
