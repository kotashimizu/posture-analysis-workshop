import { Disclaimer } from "@/components/Disclaimer";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-950">ディスクレーマー</h2>
            <div className="mt-3">
              <Disclaimer />
            </div>
          </div>
          <div className="text-sm text-slate-500">version 0.1.0</div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs leading-6 text-slate-500">
          参考情報: Kendall姿勢評価の観察軸、MediaPipe Pose Landmarkerの2Dランドマーク推定。
        </p>
      </div>
    </footer>
  );
}
