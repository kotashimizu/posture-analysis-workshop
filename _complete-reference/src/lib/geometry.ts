import type { Landmark } from "@/types";

export const POSE_LANDMARK = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
} as const;

export function landmark(landmarks: Landmark[], index: number): Landmark {
  const point = landmarks[index];
  if (!point) {
    throw new Error(`Landmark ${index} is missing`);
  }
  return point;
}

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
    visibility: ((a.visibility ?? 1) + (b.visibility ?? 1)) / 2,
  };
}

export function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function horizontalDistance(a: Landmark, b: Landmark): number {
  return Math.abs(a.x - b.x);
}

export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const dot = bax * bcx + bay * bcy;
  const length = Math.hypot(bax, bay) * Math.hypot(bcx, bcy);
  if (length === 0) {
    return 0;
  }
  const cosine = Math.min(1, Math.max(-1, dot / length));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function verticalAngle(a: Landmark, b: Landmark): number {
  return Math.abs(signedVerticalAngle(a, b));
}

export function signedVerticalAngle(a: Landmark, b: Landmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

export function horizontalAngle(a: Landmark, b: Landmark): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function bodyHeight(landmarks: Landmark[]): number {
  const shoulderMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftShoulder),
    landmark(landmarks, POSE_LANDMARK.rightShoulder),
  );
  const ankleMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftAnkle),
    landmark(landmarks, POSE_LANDMARK.rightAnkle),
  );
  return Math.max(0.001, Math.abs(ankleMid.y - shoulderMid.y));
}

export function lineDistance(point: Landmark, a: Landmark, b: Landmark): number {
  const numerator = Math.abs(
    (b.y - a.y) * point.x - (b.x - a.x) * point.y + b.x * a.y - b.y * a.x,
  );
  const denominator = Math.hypot(b.y - a.y, b.x - a.x);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function averageVisibility(landmarks: Landmark[], indices: number[]): number {
  if (indices.length === 0) {
    return 0;
  }
  const sum = indices.reduce((total, index) => total + (landmarks[index]?.visibility ?? 1), 0);
  return sum / indices.length;
}

export function round(value: number, digits = 1): number {
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}
