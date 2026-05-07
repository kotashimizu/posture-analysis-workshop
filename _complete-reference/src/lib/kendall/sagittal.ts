import {
  POSE_LANDMARK,
  angleBetween,
  landmark,
  midpoint,
  round,
  signedVerticalAngle,
} from "@/lib/geometry";
import { THRESHOLDS } from "@/lib/kendall/thresholds";
import type { EvalMetric, Landmark, MetricDirection, Severity, ViewType } from "@/types";

type SagittalSide = {
  ear: number;
  shoulder: number;
  hip: number;
  knee: number;
  ankle: number;
  foot: number;
};

function severityFrom(value: number, mild: number, severe: number): Severity {
  if (value > severe) {
    return "severe";
  }
  if (value > mild) {
    return "mild";
  }
  return "normal";
}

function displayDeg(value: number) {
  return `${round(value)}°`;
}

function sideForView(landmarks: Landmark[], view: ViewType): SagittalSide {
  const preferred =
    view === "sagittal-left"
      ? {
          ear: POSE_LANDMARK.leftEar,
          shoulder: POSE_LANDMARK.leftShoulder,
          hip: POSE_LANDMARK.leftHip,
          knee: POSE_LANDMARK.leftKnee,
          ankle: POSE_LANDMARK.leftAnkle,
          foot: POSE_LANDMARK.leftFootIndex,
        }
      : {
          ear: POSE_LANDMARK.rightEar,
          shoulder: POSE_LANDMARK.rightShoulder,
          hip: POSE_LANDMARK.rightHip,
          knee: POSE_LANDMARK.rightKnee,
          ankle: POSE_LANDMARK.rightAnkle,
          foot: POSE_LANDMARK.rightFootIndex,
        };
  const fallback =
    view === "sagittal-left"
      ? {
          ear: POSE_LANDMARK.rightEar,
          shoulder: POSE_LANDMARK.rightShoulder,
          hip: POSE_LANDMARK.rightHip,
          knee: POSE_LANDMARK.rightKnee,
          ankle: POSE_LANDMARK.rightAnkle,
          foot: POSE_LANDMARK.rightFootIndex,
        }
      : {
          ear: POSE_LANDMARK.leftEar,
          shoulder: POSE_LANDMARK.leftShoulder,
          hip: POSE_LANDMARK.leftHip,
          knee: POSE_LANDMARK.leftKnee,
          ankle: POSE_LANDMARK.leftAnkle,
          foot: POSE_LANDMARK.leftFootIndex,
        };

  const preferredVisibility =
    (landmarks[preferred.shoulder]?.visibility ?? 1) +
    (landmarks[preferred.hip]?.visibility ?? 1) +
    (landmarks[preferred.knee]?.visibility ?? 1);
  const fallbackVisibility =
    (landmarks[fallback.shoulder]?.visibility ?? 1) +
    (landmarks[fallback.hip]?.visibility ?? 1) +
    (landmarks[fallback.knee]?.visibility ?? 1);

  return preferredVisibility >= fallbackVisibility ? preferred : fallback;
}

function metric(
  id: string,
  label: string,
  value: number,
  severity: Severity,
  direction: MetricDirection,
  summary: string,
  landmarkIndices: number[],
): EvalMetric {
  return {
    id,
    label,
    value: round(value),
    displayValue: displayDeg(value),
    unit: "deg",
    severity,
    direction,
    summary,
    landmarkIndices,
  };
}

export function evaluateSagittal(landmarks: Landmark[], view: ViewType): EvalMetric[] {
  const side = sideForView(landmarks, view);
  const facingSign = view === "sagittal-right" ? 1 : -1;
  const ear = landmark(landmarks, side.ear);
  const shoulder = landmark(landmarks, side.shoulder);
  const hip = landmark(landmarks, side.hip);
  const knee = landmark(landmarks, side.knee);
  const ankle = landmark(landmarks, side.ankle);
  const foot = landmark(landmarks, side.foot);
  const shoulderMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftShoulder),
    landmark(landmarks, POSE_LANDMARK.rightShoulder),
  );
  const hipMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftHip),
    landmark(landmarks, POSE_LANDMARK.rightHip),
  );

  const headSigned = signedVerticalAngle(shoulder, ear) * facingSign;
  const headAngle = Math.abs(headSigned);
  const headSeverity = severityFrom(
    headAngle,
    THRESHOLDS.forwardHead.mild,
    THRESHOLDS.forwardHead.severe,
  );

  const shoulderSigned = signedVerticalAngle(hip, shoulder) * facingSign;
  const shoulderAngle = Math.abs(shoulderSigned);
  const shoulderSeverity = severityFrom(
    shoulderAngle,
    THRESHOLDS.forwardShoulder.mild,
    THRESHOLDS.forwardShoulder.severe,
  );

  const trunkSigned = signedVerticalAngle(hipMid, shoulderMid) * facingSign;
  const trunkAngle = Math.abs(trunkSigned);
  const trunkSeverity = severityFrom(
    trunkAngle,
    THRESHOLDS.trunkLean.mild,
    THRESHOLDS.trunkLean.severe,
  );

  const pelvicAngle = angleBetween(shoulder, hip, knee);
  const pelvicDeviation = Math.abs(180 - pelvicAngle);
  const pelvicDirection =
    (hip.x - midpoint(shoulder, knee).x) * facingSign >= 0 ? "anterior" : "posterior";
  const pelvicSeverity = severityFrom(
    pelvicDeviation,
    THRESHOLDS.pelvicTilt.mild,
    THRESHOLDS.pelvicTilt.severe,
  );

  const kneeAngle = angleBetween(hip, knee, ankle);
  const kneeDirection =
    kneeAngle > 180 ? "hyperextension" : kneeAngle < 175 ? "flexion" : "neutral";
  const kneeSeverity =
    kneeAngle > 180 + THRESHOLDS.kneeHyperextension.severe ||
    kneeAngle < 180 - THRESHOLDS.kneeFlexion.severe
      ? "severe"
      : kneeAngle > 180 + THRESHOLDS.kneeHyperextension.mild ||
          kneeAngle < 180 - THRESHOLDS.kneeFlexion.mild
        ? "mild"
        : "normal";

  const ankleAngle = angleBetween(knee, ankle, foot);
  const ankleDeviation = Math.abs(90 - ankleAngle);
  const ankleSeverity = severityFrom(
    ankleDeviation,
    THRESHOLDS.ankle.mild,
    THRESHOLDS.ankle.severe,
  );

  return [
    metric(
      "forwardHead",
      "頭部前方位",
      headAngle,
      headSeverity,
      headSigned >= 0 ? "forward" : "backward",
      headSigned >= 0 ? "耳介が肩より前方にあります。" : "耳介が肩より後方にあります。",
      [side.ear, side.shoulder],
    ),
    metric(
      "forwardShoulder",
      "肩前方位",
      shoulderAngle,
      shoulderSeverity,
      shoulderSigned >= 0 ? "forward" : "backward",
      shoulderSigned >= 0 ? "肩峰が股関節より前方にあります。" : "肩峰が股関節より後方にあります。",
      [side.shoulder, side.hip],
    ),
    metric(
      "trunkLean",
      "体幹前後傾",
      trunkAngle,
      trunkSeverity,
      trunkSigned >= 0 ? "forward" : "backward",
      trunkSigned >= 0 ? "体幹が前傾しています。" : "体幹が後傾しています。",
      [POSE_LANDMARK.leftShoulder, POSE_LANDMARK.rightShoulder, POSE_LANDMARK.leftHip, POSE_LANDMARK.rightHip],
    ),
    metric(
      "pelvicTilt",
      "骨盤傾斜傾向",
      pelvicDeviation,
      pelvicSeverity,
      pelvicDirection,
      pelvicDirection === "anterior" ? "骨盤前傾方向の傾向です。" : "骨盤後傾方向の傾向です。",
      [side.shoulder, side.hip, side.knee],
    ),
    metric(
      "kneeExtension",
      "膝伸展度",
      Math.abs(180 - kneeAngle),
      kneeSeverity,
      kneeDirection,
      kneeDirection === "hyperextension"
        ? "膝過伸展方向の傾向です。"
        : kneeDirection === "flexion"
          ? "膝屈曲方向の傾向です。"
          : "膝伸展は仮閾値内です。",
      [side.hip, side.knee, side.ankle],
    ),
    metric(
      "ankleAngle",
      "足関節",
      ankleDeviation,
      ankleSeverity,
      ankleAngle > 90 ? "flexion" : "backward",
      ankleAngle > 90 ? "足関節角度が背屈方向に寄っています。" : "足関節角度が底屈方向に寄っています。",
      [side.knee, side.ankle, side.foot],
    ),
  ];
}
