import { VIEW_LABELS } from "@/content/view-labels";
import type { ViewType } from "@/types";

type ViewSelectorProps = {
  detectedView: ViewType | null;
};

export function ViewSelector({ detectedView }: ViewSelectorProps) {
  const autoLabel = detectedView ? VIEW_LABELS[detectedView] : "判別前（画像を読み込むと自動判別します）";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        撮影視点（自動判別）
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950" data-nowrap>
        {autoLabel}
      </div>
    </div>
  );
}
