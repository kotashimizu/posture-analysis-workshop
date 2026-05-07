import {
  POSE_LANDMARK,
  bodyHeight,
  horizontalAngle,
  landmark,
  lineDistance,
  midpoint,
  round,
} from "@/lib/geometry";
import { THRESHOLDS } from "@/lib/kendall/thresholds";
import type { EvalMetric, Landmark, MetricDirection, Severity, ViewType } from "@/types";

function severityFrom(value: number, mild: number, severe: number): Severity {
  if (value > severe) {
    return "severe";
  }
  if (value > mild) {
    return "mild";
  }
  return "normal";
}

function metric(
  id: string,
  label: string,
  value: number,
  displayValue: string,
  unit: "deg" | "percent" | "score",
  severity: Severity,
  direction: MetricDirection,
  summary: string,
  landmarkIndices: number[],
): EvalMetric {
  return {
    id,
    label,
    value: round(value),
    displayValue,
    unit,
    severity,
    direction,
    summary,
    landmarkIndices,
  };
}

function percentDisplay(ratio: number) {
  return `${round(ratio * 100, 1)}%`;
}

function sideDirection(leftY: number, rightY: number): MetricDirection {
  return leftY < rightY ? "left" : "right";
}

function kneeAlignmentMetric(
  id: string,
  label: string,
  hip: Landmark,
  knee: Landmark,
  ankle: Landmark,
  bodyMidX: number,
  height: number,
  indices: number[],
): EvalMetric {
  const ratio = lineDistance(knee, hip, ankle) / height;
  const severity = severityFrom(
    ratio,
    THRESHOLDS.kneeAlignment.mild,
    THRESHOLDS.kneeAlignment.severe,
  );
  const ankleToMid = Math.abs(ankle.x - bodyMidX);
  const kneeToMid = Math.abs(knee.x - bodyMidX);
  const direction = kneeToMid < ankleToMid ? "medial" : "lateral";

  return metric(
    id,
    label,
    ratio * 100,
    percentDisplay(ratio),
    "percent",
    severity,
    direction,
    direction === "medial"
      ? "膝が内側へ入る方向の傾向です。"
      : "膝が外側へ開く方向の傾向です。",
    indices,
  );
}

export function evaluateFrontal(landmarks: Landmark[], _view: ViewType): EvalMetric[] {
  const leftEar = landmark(landmarks, POSE_LANDMARK.leftEar);
  const rightEar = landmark(landmarks, POSE_LANDMARK.rightEar);
  const leftShoulder = landmark(landmarks, POSE_LANDMARK.leftShoulder);
  const rightShoulder = landmark(landmarks, POSE_LANDMARK.rightShoulder);
  const leftHip = landmark(landmarks, POSE_LANDMARK.leftHip);
  const rightHip = landmark(landmarks, POSE_LANDMARK.rightHip);
  const leftKnee = landmark(landmarks, POSE_LANDMARK.leftKnee);
  const rightKnee = landmark(landmarks, POSE_LANDMARK.rightKnee);
  const leftAnkle = landmark(landmarks, POSE_LANDMARK.leftAnkle);
  const rightAnkle = landmark(landmarks, POSE_LANDMARK.rightAnkle);
  const leftHeel = landmark(landmarks, POSE_LANDMARK.leftHeel);
  const rightHeel = landmark(landmarks, POSE_LANDMARK.rightHeel);
  const leftFoot = landmark(landmarks, POSE_LANDMARK.leftFootIndex);
  const rightFoot = landmark(landmarks, POSE_LANDMARK.rightFootIndex);
  const height = bodyHeight(landmarks);
  const bodyMid = midpoint(leftHip, rightHip);

  const headTilt = Math.abs(horizontalAngle(leftEar, rightEar));
  const headSeverity = severityFrom(
    headTilt,
    THRESHOLDS.headTilt.mild,
    THRESHOLDS.headTilt.severe,
  );
  const shoulderRatio = Math.abs(leftShoulder.y - rightShoulder.y) / height;
  const pelvicRatio = Math.abs(leftHip.y - rightHip.y) / height;
  const leftFootAngle = Math.abs(horizontalAngle(leftHeel, leftFoot));
  const rightFootAngle = Math.abs(horizontalAngle(rightHeel, rightFoot));
  const footScore = (leftFootAngle + rightFootAngle) / 2;
  const footSeverity = severityFrom(
    Math.abs(footScore),
    THRESHOLDS.ankle.mild,
    THRESHOLDS.ankle.severe,
  );

  return [
    metric(
      "headTilt",
      "頭部側方傾斜",
      headTilt,
      `${round(headTilt)}°`,
      "deg",
      headSeverity,
      sideDirection(leftEar.y, rightEar.y),
      leftEar.y < rightEar.y ? "頭部が左側へ傾く傾向です。" : "頭部が右側へ傾く傾向です。",
      [POSE_LANDMARK.leftEar, POSE_LANDMARK.rightEar],
    ),
    metric(
      "shoulderAsymmetry",
      "肩高さ左右差",
      shoulderRatio * 100,
      percentDisplay(shoulderRatio),
      "percent",
      severityFrom(
        shoulderRatio,
        THRESHOLDS.shoulderAsymmetry.mild,
        THRESHOLDS.shoulderAsymmetry.severe,
      ),
      sideDirection(leftShoulder.y, rightShoulder.y),
      leftShoulder.y < rightShoulder.y
        ? "左肩が相対的に高い傾向です。"
        : "右肩が相対的に高い傾向です。",
      [POSE_LANDMARK.leftShoulder, POSE_LANDMARK.rightShoulder],
    ),
    metric(
      "pelvicAsymmetry",
      "骨盤高さ左右差",
      pelvicRatio * 100,
      percentDisplay(pelvicRatio),
      "percent",
      severityFrom(
        pelvicRatio,
        THRESHOLDS.pelvicAsymmetry.mild,
        THRESHOLDS.pelvicAsymmetry.severe,
      ),
      sideDirection(leftHip.y, rightHip.y),
      leftHip.y < rightHip.y
        ? "左骨盤が相対的に高い傾向です。"
        : "右骨盤が相対的に高い傾向です。",
      [POSE_LANDMARK.leftHip, POSE_LANDMARK.rightHip],
    ),
    kneeAlignmentMetric(
      "leftKneeAlignment",
      "膝アライメント（左）",
      leftHip,
      leftKnee,
      leftAnkle,
      bodyMid.x,
      height,
      [POSE_LANDMARK.leftHip, POSE_LANDMARK.leftKnee, POSE_LANDMARK.leftAnkle],
    ),
    kneeAlignmentMetric(
      "rightKneeAlignment",
      "膝アライメント（右）",
      rightHip,
      rightKnee,
      rightAnkle,
      bodyMid.x,
      height,
      [POSE_LANDMARK.rightHip, POSE_LANDMARK.rightKnee, POSE_LANDMARK.rightAnkle],
    ),
    metric(
      "footAngle",
      "足部",
      footScore,
      `${round(footScore)}°`,
      "deg",
      footSeverity,
      "lateral",
      "足部角度に外旋または内旋方向の左右差が見られる可能性があります。",
      [
        POSE_LANDMARK.leftHeel,
        POSE_LANDMARK.leftFootIndex,
        POSE_LANDMARK.rightHeel,
        POSE_LANDMARK.rightFootIndex,
      ],
    ),
  ];
}
