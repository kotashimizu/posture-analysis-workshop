import { Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-950 text-white">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              姿勢分析Webアプリ
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              MediaPipe Pose Landmarkerで姿勢ランドマークを検出し、Kendall評価を参考表示します。
            </p>
          </div>
        </div>
        <Badge variant="success" className="w-fit">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          画像と動画はブラウザ内で処理
        </Badge>
      </div>
    </header>
  );
}
