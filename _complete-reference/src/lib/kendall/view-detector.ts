import { POSE_LANDMARK } from "@/lib/geometry";
import type { Landmark, ViewType } from "@/types";

const LEFT_EYE_INDEX = 2;
const RIGHT_EYE_INDEX = 5;
const DEFAULT_VIEW: ViewType = "sagittal-left";

// TODO: 要臨床調整: 臨床経験または文献値で要更新
const FRONTAL_WIDTH_RATIO_THRESHOLD = 0.18;
// TODO: 要臨床調整: 臨床経験または文献値で要更新
const FACE_VISIBILITY_THRESHOLD = 0.7;

function visibility(point: Landmark | undefined) {
  return point?.visibility ?? 0;
}

/**
 * MediaPipeのランドマークから撮影視点を自動判別する。
 *
 * 判別ロジック:
 * 1. 矢状面と前額面: 左右肩と左右股関節のx座標差を体高で正規化して判定
 * 2. 前額面の前後: 鼻と両目のvisibility平均で判定
 * 3. 矢状面の左右: 左右の肩と耳のvisibility差で判定
 */
export function detectView(landmarks: Landmark[]): ViewType {
  if (landmarks.length < 33) {
    return DEFAULT_VIEW;
  }

  const leftShoulder = landmarks[POSE_LANDMARK.leftShoulder];
  const rightShoulder = landmarks[POSE_LANDMARK.rightShoulder];
  const leftHip = landmarks[POSE_LANDMARK.leftHip];
  const rightHip = landmarks[POSE_LANDMARK.rightHip];
  const leftAnkle = landmarks[POSE_LANDMARK.leftAnkle];
  const rightAnkle = landmarks[POSE_LANDMARK.rightAnkle];

  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;
  const bodyHeight = Math.abs(ankleMidY - shoulderMidY) || 1;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x);
  const widthRatio = (shoulderWidth + hipWidth) / 2 / bodyHeight;

  if (widthRatio > FRONTAL_WIDTH_RATIO_THRESHOLD) {
    const faceVisibility =
      (visibility(landmarks[POSE_LANDMARK.nose]) +
        visibility(landmarks[LEFT_EYE_INDEX]) +
        visibility(landmarks[RIGHT_EYE_INDEX])) /
      3;

    return faceVisibility > FACE_VISIBILITY_THRESHOLD ? "frontal-front" : "frontal-back";
  }

  const leftSideVisibility =
    (visibility(landmarks[POSE_LANDMARK.leftShoulder]) +
      visibility(landmarks[POSE_LANDMARK.leftEar])) /
    2;
  const rightSideVisibility =
    (visibility(landmarks[POSE_LANDMARK.rightShoulder]) +
      visibility(landmarks[POSE_LANDMARK.rightEar])) /
    2;

  return rightSideVisibility > leftSideVisibility ? "sagittal-left" : "sagittal-right";
}

/**
 * 自動判別の信頼度を0から1で返す。
 */
export function detectViewConfidence(landmarks: Landmark[]): number {
  const visibilities = landmarks.map((point) => point.visibility ?? 0).filter((value) => value > 0);

  if (visibilities.length === 0) {
    return 0;
  }

  return visibilities.reduce((total, value) => total + value, 0) / visibilities.length;
}
