import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";

let imageLandmarker: PoseLandmarker | null = null;
let videoLandmarker: PoseLandmarker | null = null;

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

async function createLandmarker(mode: "IMAGE" | "VIDEO", delegate: "GPU" | "CPU") {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: mode,
    numPoses: 1,
  });
}

export async function initPoseDetector(onProgress?: (message: string) => void) {
  if (imageLandmarker) {
    return imageLandmarker;
  }

  onProgress?.("MediaPipeを準備中...");
  try {
    imageLandmarker = await createLandmarker("IMAGE", "GPU");
  } catch {
    onProgress?.("GPU初期化に失敗したためCPUで準備中...");
    imageLandmarker = await createLandmarker("IMAGE", "CPU");
  }
  onProgress?.("MediaPipeの準備が完了しました。");
  return imageLandmarker;
}

export async function initVideoPoseDetector(onProgress?: (message: string) => void) {
  if (videoLandmarker) {
    return videoLandmarker;
  }

  onProgress?.("VIDEOモードを準備中...");
  try {
    videoLandmarker = await createLandmarker("VIDEO", "GPU");
  } catch {
    onProgress?.("GPU初期化に失敗したためCPUでVIDEOモードを準備中...");
    videoLandmarker = await createLandmarker("VIDEO", "CPU");
  }
  onProgress?.("VIDEOモードの準備が完了しました。");
  return videoLandmarker;
}

export async function detectPose(source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  const detector = await initPoseDetector();
  return detector.detect(source);
}

export async function detectPoseForVideo(
  video: HTMLVideoElement,
  timestampMs: number,
): Promise<PoseLandmarkerResult> {
  const detector = await initVideoPoseDetector();
  return detector.detectForVideo(video, timestampMs);
}

export function resetPoseDetectorForTest() {
  imageLandmarker?.close();
  videoLandmarker?.close();
  imageLandmarker = null;
  videoLandmarker = null;
}
