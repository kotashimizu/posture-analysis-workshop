import { useCallback } from "react";
import { detectPose, detectPoseForVideo, initPoseDetector } from "@/lib/pose-detector";
import { useMediaPipeStatus } from "@/hooks/useMediaPipeStatus";

type DetectSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export function usePoseDetector() {
  const status = useMediaPipeStatus();
  const { setError, setMessage, setState } = status;

  const initialize = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      await initPoseDetector((message) => setMessage(message));
      setState("ready");
    } catch (error) {
      setState("error");
      setError(error instanceof Error ? error.message : "MediaPipeの初期化に失敗しました。");
    }
  }, [setError, setMessage, setState]);

  const detect = useCallback(
    async (source: DetectSource) => {
      setState("loading");
      setError(null);
      try {
        const result = await detectPose(source);
        setState("ready");
        setMessage("姿勢ランドマークを検出しました。");
        return result;
      } catch (error) {
        setState("error");
        setError(error instanceof Error ? error.message : "姿勢検出に失敗しました。");
        throw error;
      }
    },
    [setError, setMessage, setState],
  );

  const detectVideo = useCallback(
    async (video: HTMLVideoElement, timestampMs: number) => {
      try {
        return await detectPoseForVideo(video, timestampMs);
      } catch (error) {
        setState("error");
        setError(error instanceof Error ? error.message : "ライブ姿勢検出に失敗しました。");
        throw error;
      }
    },
    [setError, setState],
  );

  return {
    ...status,
    initialize,
    detect,
    detectVideo,
  };
}
