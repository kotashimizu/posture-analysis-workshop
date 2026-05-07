import { averageVisibility, POSE_LANDMARK } from "@/lib/geometry";
import { evaluateFrontal } from "@/lib/kendall/frontal";
import { generateFindings } from "@/lib/kendall/findings";
import { classifyPostureType } from "@/lib/kendall/posture-type";
import { evaluateSagittal } from "@/lib/kendall/sagittal";
import type { EvalResult, Landmark, ViewType } from "@/types";

export { detectView, detectViewConfidence } from "@/lib/kendall/view-detector";

const REQUIRED_INDICES = [
  POSE_LANDMARK.leftEar,
  POSE_LANDMARK.rightEar,
  POSE_LANDMARK.leftShoulder,
  POSE_LANDMARK.rightShoulder,
  POSE_LANDMARK.leftHip,
  POSE_LANDMARK.rightHip,
  POSE_LANDMARK.leftKnee,
  POSE_LANDMARK.rightKnee,
  POSE_LANDMARK.leftAnkle,
  POSE_LANDMARK.rightAnkle,
  POSE_LANDMARK.leftFootIndex,
  POSE_LANDMARK.rightFootIndex,
];

export function isReliablePose(landmarks: Landmark[]) {
  if (landmarks.length < 33) {
    return false;
  }
  return averageVisibility(landmarks, REQUIRED_INDICES) >= 0.35;
}

export function evaluate(landmarks: Landmark[], view: ViewType): EvalResult {
  const isSagittal = view.startsWith("sagittal");
  const metrics = isSagittal ? evaluateSagittal(landmarks, view) : evaluateFrontal(landmarks, view);
  const postureType = isSagittal ? classifyPostureType(metrics) : null;
  const findings = generateFindings(metrics, postureType, view);

  return {
    view,
    postureType,
    metrics,
    findings,
  };
}
