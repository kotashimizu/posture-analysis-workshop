import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MediaInput } from "@/components/MediaInput";
import { ModeTabs } from "@/components/ModeTabs";
import { PoseCanvas } from "@/components/PoseCanvas";
import { ReportPanel } from "@/components/ReportPanel";
import { VideoScrubber } from "@/components/VideoScrubber";
import { ViewSelector } from "@/components/ViewSelector";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { usePoseDetector } from "@/hooks/usePoseDetector";
import { detectView, evaluate, isReliablePose } from "@/lib/kendall";
import type { EvalResult, Landmark, MediaMode, MediaSource, VideoSource, ViewType } from "@/types";

const DISCLAIMER_STORAGE_KEY = "posture-analysis-disclaimer-accepted";

function normalizeLandmarks(points: Landmark[]) {
  return points.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
    visibility: point.visibility,
  }));
}

export default function App() {
  const pose = usePoseDetector();
  const [mode, setMode] = useState<MediaMode>("image");
  const [detectedView, setDetectedView] = useState<ViewType | null>(null);
  const [source, setSource] = useState<MediaSource | null>(null);
  const [video, setVideo] = useState<VideoSource | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(
    () => localStorage.getItem(DISCLAIMER_STORAGE_KEY) !== "true",
  );

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    setDialogOpen(false);
  };

  const clearResult = () => {
    setSource(null);
    setVideo(null);
    setLandmarks(null);
    setResult(null);
    setDetectedView(null);
    setAppError(null);
  };

  const runDetection = async (nextSource: MediaSource) => {
    setAppError(null);
    setSource(nextSource);
    setLandmarks(null);
    setResult(null);
    setDetectedView(null);

    try {
      const detection = await pose.detect(nextSource.element);
      const rawLandmarks = detection.landmarks[0] as Landmark[] | undefined;

      if (!rawLandmarks || !isReliablePose(rawLandmarks)) {
        setAppError(
          "人物の主要ランドマークを十分に検出できません。全身が画面に入るように撮影ガイドを確認してください。",
        );
        return;
      }

      const nextLandmarks = normalizeLandmarks(rawLandmarks);
      const nextDetectedView = detectView(nextLandmarks);
      const nextResult = evaluate(nextLandmarks, nextDetectedView);
      setLandmarks(nextLandmarks);
      setDetectedView(nextDetectedView);
      setResult(nextResult);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "姿勢検出に失敗しました。");
    }
  };

  const handleImageFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setVideo(null);
      void runDetection({ kind: "image", url, element: image });
    };
    image.onerror = () => setAppError("画像を読み込めません。別のファイルを選択してください。");
    image.src = url;
  };

  const handleVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideo({ url, fileName: file.name });
    setSource(null);
    setLandmarks(null);
    setResult(null);
    setDetectedView(null);
    setAppError(null);
  };

  const handleFileAccepted = (file: File) => {
    if (mode === "image") {
      handleImageFile(file);
    } else {
      handleVideoFile(file);
    }
  };

  const handleImageCaptured = (canvas: HTMLCanvasElement, previewUrl: string) => {
    setVideo(null);
    void runDetection({ kind: "canvas", url: previewUrl, element: canvas });
  };

  const handleVideoCaptured = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setVideo({ url, fileName: "camera-capture.webm" });
    setSource(null);
    setLandmarks(null);
    setResult(null);
    setDetectedView(null);
    setAppError(null);
  };

  const handleFrameSelected = (canvas: HTMLCanvasElement, previewUrl: string) => {
    void runDetection({ kind: "canvas", url: previewUrl, element: canvas });
  };

  const handleModeChange = (nextMode: MediaMode) => {
    setMode(nextMode);
    setAppError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>入力条件</CardTitle>
            <CardDescription>
              画像または動画を選び、撮影視点を自動判別してから姿勢ランドマークを評価します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <div className="label mb-2 text-sm font-semibold text-slate-950">入力モード</div>
                <ModeTabs value={mode} onChange={handleModeChange} />
              </div>
              <div>
                <div className="label mb-2 text-sm font-semibold text-slate-950">視点</div>
                <ViewSelector detectedView={detectedView} />
              </div>
            </div>
            <MediaInput
              mode={mode}
              onFileAccepted={handleFileAccepted}
              onImageCaptured={handleImageCaptured}
              onVideoCaptured={handleVideoCaptured}
              onError={setAppError}
            />
          </CardContent>
        </Card>

        {pose.state === "loading" ? (
          <Alert title={pose.message}>
            <Progress value={72} className="mt-2" />
          </Alert>
        ) : null}

        {pose.error ? (
          <Alert variant="danger" title="MediaPipeモデルを読み込めません">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{pose.error}</span>
              <Button variant="outline" onClick={pose.initialize}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                再試行
              </Button>
            </div>
          </Alert>
        ) : null}

        {appError ? <Alert variant="warning">{appError}</Alert> : null}

        <VideoScrubber video={video} onFrameSelected={handleFrameSelected} onError={setAppError} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
          <PoseCanvas
            source={source}
            landmarks={landmarks}
            result={result}
            view={detectedView ?? "sagittal-left"}
            loading={pose.state === "loading"}
          />
          <ReportPanel result={result} />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            画像と動画は外部サーバーへ送信せず、ブラウザ内で処理します。
          </span>
          <Button variant="outline" onClick={clearResult}>
            解析内容をクリア
          </Button>
        </div>
      </main>
      <Footer />
      <Dialog
        open={dialogOpen}
        title="利用前の確認"
        description="本アプリは姿勢評価の参考情報を表示するツールです。"
        actionLabel="同意して始める"
        onAction={acceptDisclaimer}
      >
        <Disclaimer />
      </Dialog>
    </div>
  );
}
