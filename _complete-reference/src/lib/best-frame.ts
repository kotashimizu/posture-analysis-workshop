import type { Landmark } from "@/types";

export type BestFrameResult = {
  timeSec: number;
  movementScore: number;
  totalSampled: number;
};

export type DetectAtTimeFn = (
  video: HTMLVideoElement,
  timeSec: number,
) => Promise<Landmark[] | null>;

type FindBestFrameOptions = {
  sampleIntervalSec?: number;
  maxSamples?: number;
  signal?: AbortSignal;
  onProgress?: (current: number, total: number) => void;
};

export async function findBestFrame(
  video: HTMLVideoElement,
  detectAtTime: DetectAtTimeFn,
  options?: FindBestFrameOptions,
): Promise<BestFrameResult | null> {
  const interval = options?.sampleIntervalSec ?? 0.4; // TODO: 要臨床調整
  const maxSamples = options?.maxSamples ?? 60; // TODO: 要臨床調整
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (duration <= 0) {
    return null;
  }

  const sampleCount = Math.min(maxSamples, Math.max(3, Math.floor(duration / interval)));
  const actualInterval = duration / sampleCount;
  const samples: { time: number; landmarks: Landmark[] }[] = [];

  for (let i = 0; i < sampleCount; i += 1) {
    if (options?.signal?.aborted) {
      return null;
    }

    const time = Math.min(i * actualInterval, duration);
    const landmarks = await detectAtTime(video, time);
    if (options?.signal?.aborted) {
      return null;
    }
    if (landmarks && landmarks.length > 0) {
      samples.push({ time, landmarks });
    }
    options?.onProgress?.(i + 1, sampleCount);
  }

  if (samples.length < 3) {
    return null;
  }

  let bestIndex = 1;
  let minMovement = Infinity;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const movement =
      computeMovement(samples[i - 1].landmarks, samples[i].landmarks) +
      computeMovement(samples[i].landmarks, samples[i + 1].landmarks);
    if (movement < minMovement) {
      minMovement = movement;
      bestIndex = i;
    }
  }

  return {
    timeSec: samples[bestIndex].time,
    movementScore: minMovement,
    totalSampled: samples.length,
  };
}

function computeMovement(a: Landmark[], b: Landmark[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const dx = (a[i]?.x ?? 0) - (b[i]?.x ?? 0);
    const dy = (a[i]?.y ?? 0) - (b[i]?.y ?? 0);
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return len > 0 ? sum / len : Infinity; // TODO: 要臨床調整
}
