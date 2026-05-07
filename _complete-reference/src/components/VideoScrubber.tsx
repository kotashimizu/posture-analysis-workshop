import { useEffect, useRef, useState } from "react";
import { Film, ScanLine, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { usePoseDetector } from "@/hooks/usePoseDetector";
import { findBestFrame, type DetectAtTimeFn } from "@/lib/best-frame";
import { captureVideoFrame, seekVideo } from "@/lib/video-frame";
import type { Landmark, VideoSource } from "@/types";

type VideoScrubberProps = {
  video: VideoSource | null;
  onFrameSelected: (canvas: HTMLCanvasElement, previewUrl: string) => void;
  onError: (message: string) => void;
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatSeconds(value: number) {
  return `${value.toFixed(1)}秒`;
}

export function VideoScrubber({ video, onFrameSelected, onError }: VideoScrubberProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const pose = usePoseDetector();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [bestFrameAnalyzing, setBestFrameAnalyzing] = useState(false);
  const [bestFrameProgress, setBestFrameProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [bestFrameMessage, setBestFrameMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    setBestFrameAnalyzing(false);
    setBestFrameProgress(null);
    setBestFrameMessage(null);
  }, [video?.url]);

  const handleLoadedMetadata = () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }
    setDuration(videoElement.duration);
    setCurrentTime(0);
    if (videoElement.duration > 120) {
      setWarning("動画が2分を超えています。短い区間に切り出してからの利用を推奨します。");
    } else {
      setWarning(null);
    }
  };

  const handleSeek = async (value: number) => {
    const videoElement = videoRef.current;
    setCurrentTime(value);
    if (!videoElement) {
      return;
    }
    try {
      await seekVideo(videoElement, value);
    } catch {
      onError("動画の指定時刻へ移動できません。");
    }
  };

  const evaluateCurrentFrame = () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      onError("動画が読み込まれていません。");
      return;
    }
    try {
      const canvas = captureVideoFrame(videoElement);
      onFrameSelected(canvas, canvas.toDataURL("image/png"));
    } catch (error) {
      onError(error instanceof Error ? error.message : "動画フレームを取得できません。");
    }
  };

  const selectBestFrame = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      onError("動画が読み込まれていません。");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBestFrameAnalyzing(true);
    setBestFrameProgress({ current: 0, total: 1 });
    setBestFrameMessage("ベストフレームを解析中です。");
    let sampledTotal = 0;

    const detectAtTime: DetectAtTimeFn = async (targetVideo, timeSec) => {
      if (controller.signal.aborted) {
        return null;
      }
      await seekVideo(targetVideo, timeSec);
      if (controller.signal.aborted) {
        return null;
      }
      const canvas = captureVideoFrame(targetVideo);
      const detection = await pose.detect(canvas);
      return (detection.landmarks[0] as Landmark[] | undefined) ?? null;
    };

    try {
      const result = await findBestFrame(videoElement, detectAtTime, {
        signal: controller.signal,
        onProgress: (current, total) => {
          sampledTotal = total;
          if (!controller.signal.aborted && mountedRef.current) {
            setBestFrameProgress({ current, total });
          }
        },
      });

      if (controller.signal.aborted || !mountedRef.current) {
        return;
      }

      if (!result) {
        onError("ベストフレームを選択できません。人物が写っている区間を指定してください。");
        setBestFrameMessage("ベストフレームを選択できませんでした。");
        return;
      }

      await seekVideo(videoElement, result.timeSec);
      if (controller.signal.aborted || !mountedRef.current) {
        return;
      }
      setCurrentTime(result.timeSec);
      const canvas = captureVideoFrame(videoElement);
      onFrameSelected(canvas, canvas.toDataURL("image/png"));
      setBestFrameMessage(
        `${result.totalSampled}/${sampledTotal || result.totalSampled} フレームを解析しました。最適フレーム: ${formatSeconds(
          result.timeSec,
        )}`,
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        onError(error instanceof Error ? error.message : "ベストフレーム解析に失敗しました。");
        setBestFrameMessage("ベストフレーム解析に失敗しました。");
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (mountedRef.current) {
        setBestFrameAnalyzing(false);
      }
    }
  };

  const progressValue = bestFrameProgress
    ? (bestFrameProgress.current / bestFrameProgress.total) * 100
    : 0;

  return video ? (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-900">
          <Film className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950">動画フレーム選択</h2>
          <p className="text-sm leading-6 text-slate-600">{video.fileName}</p>
        </div>
      </div>
      {warning ? <Alert variant="warning">{warning}</Alert> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <video
          ref={videoRef}
          src={video.url}
          className="aspect-video w-full rounded-xl bg-slate-950 object-contain"
          controls
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        />
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4">
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-900">
              <span>評価時刻</span>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="mt-4">
              <Slider
                min={0}
                max={Math.max(duration, 0.1)}
                step={0.1}
                value={Math.min(currentTime, duration)}
                onValueChange={handleSeek}
              />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <span>
                  {bestFrameProgress
                    ? `${bestFrameProgress.current}/${bestFrameProgress.total} フレーム`
                    : "未解析"}
                </span>
                <span>{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="mt-2" />
              {bestFrameMessage ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{bestFrameMessage}</p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              onClick={selectBestFrame}
              disabled={bestFrameAnalyzing || duration <= 0}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              ベストフレーム自動選択
            </Button>
            <Button onClick={evaluateCurrentFrame} disabled={bestFrameAnalyzing}>
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              このフレームで評価
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
