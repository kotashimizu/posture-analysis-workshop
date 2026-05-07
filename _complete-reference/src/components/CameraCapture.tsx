import { useEffect, useRef, useState } from "react";
import { Camera, CircleStop, Play, Video } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePoseDetector } from "@/hooks/usePoseDetector";
import { drawSkeletonSimple } from "@/lib/canvas-draw";
import { requestCameraStream, stopCameraStream } from "@/lib/camera";
import type { Landmark, MediaMode } from "@/types";

type CameraCaptureProps = {
  mode: MediaMode;
  onImageCaptured: (canvas: HTMLCanvasElement, previewUrl: string) => void;
  onVideoCaptured: (blob: Blob) => void;
  onError: (message: string) => void;
};

export function CameraCapture({
  mode,
  onImageCaptured,
  onVideoCaptured,
  onError,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastVideoTimestampRef = useRef(-1);
  const timestampOffsetRef = useRef(0);
  const previewErrorShownRef = useRef(false);
  const { detectVideo } = usePoseDetector();
  const [active, setActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCameraStream(streamRef.current);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let stopped = false;
    let animationFrameId: number | null = null;
    lastVideoTimestampRef.current = -1;
    timestampOffsetRef.current = Math.round(performance.now());
    previewErrorShownRef.current = false;

    const scheduleNextFrame = () => {
      if (!stopped) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = async () => {
      const videoElement = videoRef.current;
      const canvas = skeletonCanvasRef.current;
      if (
        !videoElement ||
        !canvas ||
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0
      ) {
        scheduleNextFrame();
        return;
      }

      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        scheduleNextFrame();
        return;
      }

      const videoTimestampMs = Math.round(videoElement.currentTime * 1000);
      if (videoTimestampMs <= lastVideoTimestampRef.current) {
        scheduleNextFrame();
        return;
      }
      lastVideoTimestampRef.current = videoTimestampMs;

      try {
        const detection = await detectVideo(videoElement, timestampOffsetRef.current + videoTimestampMs);
        if (stopped) {
          return;
        }
        drawSkeletonSimple(
          context,
          (detection.landmarks[0] as Landmark[] | undefined) ?? null,
          width,
          height,
        );
      } catch {
        context.clearRect(0, 0, width, height);
        if (!previewErrorShownRef.current) {
          const message = "ライブ骨格プレビューを表示できません。";
          setLocalError(message);
          onError(message);
          previewErrorShownRef.current = true;
        }
      } finally {
        scheduleNextFrame();
      }
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => {
      stopped = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      const canvas = skeletonCanvasRef.current;
      const context = canvas?.getContext("2d");
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, detectVideo, onError]);

  const startCamera = async () => {
    setLocalError(null);
    try {
      stopCameraStream(streamRef.current);
      const stream = await requestCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      lastVideoTimestampRef.current = -1;
      timestampOffsetRef.current = Math.round(performance.now());
      previewErrorShownRef.current = false;
      setActive(true);
    } catch (error) {
      setActive(false);
      const message =
        error instanceof Error
          ? error.message
          : "カメラを起動できません。ブラウザ設定を確認してください。";
      setLocalError(message);
      onError(message);
    }
  };

  const captureImage = () => {
    const videoElement = videoRef.current;
    if (!videoElement || videoElement.videoWidth === 0) {
      onError("カメラ映像を取得できません。");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      onError("Canvasを初期化できません。");
      return;
    }
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    onImageCaptured(canvas, canvas.toDataURL("image/png"));
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) {
      onError("録画前にカメラを起動してください。");
      return;
    }
    if (!("MediaRecorder" in window)) {
      onError("このブラウザでは録画機能を利用できません。");
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onVideoCaptured(blob);
      setRecording(false);
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-950">カメラで撮影</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              全身が入るよう縦向き撮影を推奨します。映像はブラウザ内のみで処理します。
            </p>
          </div>
          <Button variant={active ? "secondary" : "primary"} onClick={startCamera}>
            <Camera className="h-4 w-4" aria-hidden="true" />
            {active ? "カメラ再起動" : "カメラ起動"}
          </Button>
        </div>
        {localError ? <Alert variant="warning">{localError}</Alert> : null}
        <div className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden rounded-xl bg-slate-950">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            muted
            playsInline
          />
          <canvas
            ref={skeletonCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {mode === "image" ? (
            <Button onClick={captureImage} disabled={!active}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              シャッター
            </Button>
          ) : (
            <>
              <Button onClick={startRecording} disabled={!active || recording}>
                <Play className="h-4 w-4" aria-hidden="true" />
                録画開始
              </Button>
              <Button
                variant="outline"
                onClick={stopRecording}
                disabled={!recording}
              >
                <CircleStop className="h-4 w-4" aria-hidden="true" />
                録画停止
              </Button>
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Video className="h-4 w-4" aria-hidden="true" />
                webm形式で保存します
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
