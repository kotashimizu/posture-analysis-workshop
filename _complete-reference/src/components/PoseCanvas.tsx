import { useEffect, useRef } from "react";
import { Crosshair } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { drawPoseCanvas } from "@/lib/canvas-draw";
import type { EvalResult, Landmark, MediaSource, ViewType } from "@/types";

type PoseCanvasProps = {
  source: MediaSource | null;
  landmarks: Landmark[] | null;
  result: EvalResult | null;
  view: ViewType;
  loading: boolean;
};

export function PoseCanvas({ source, landmarks, result, view, loading }: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) {
      return;
    }
    drawPoseCanvas(canvas, source.element, landmarks, view, result?.metrics ?? []);
  }, [source, landmarks, result, view]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-blue-900" aria-hidden="true" />
          プレビューと検出結果
        </CardTitle>
        <CardDescription>
          骨格点、接続線、基準線をCanvas上に描画します。逸脱指標はオレンジまたは赤で表示します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="mb-4 space-y-2">
            <Progress value={66} />
            <p className="text-sm text-slate-600">MediaPipeで姿勢ランドマークを検出中です。</p>
          </div>
        ) : null}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          {source ? (
            <canvas ref={canvasRef} className="block max-h-[70vh] w-full object-contain" />
          ) : (
            <div className="grid aspect-video place-items-center p-6 text-center text-sm leading-6 text-slate-300">
              画像または動画フレームを選択すると、ここに検出結果が表示されます。
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
