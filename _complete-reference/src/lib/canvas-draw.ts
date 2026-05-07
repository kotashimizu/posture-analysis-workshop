import { POSE_LANDMARK, landmark, midpoint } from "@/lib/geometry";
import type { EvalMetric, Landmark, Severity, ViewType } from "@/types";

const CONNECTIONS: Array<[number, number]> = [
  [0, 7],
  [0, 8],
  [7, 11],
  [8, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [27, 31],
  [28, 32],
];

type DrawableSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

function sourceSize(source: DrawableSource) {
  if (source instanceof HTMLImageElement) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  }

  if (source instanceof HTMLVideoElement) {
    return {
      width: source.videoWidth,
      height: source.videoHeight,
    };
  }

  return {
    width: source.width,
    height: source.height,
  };
}

function pointToCanvas(point: Landmark, width: number, height: number) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function severityColor(severity: Severity) {
  if (severity === "severe") {
    return "#dc2626";
  }
  if (severity === "mild") {
    return "#ea580c";
  }
  return "#2563eb";
}

function highlightedLandmarks(metrics: EvalMetric[]) {
  const map = new Map<number, Severity>();
  metrics.forEach((metric) => {
    if (metric.severity === "normal") {
      return;
    }
    metric.landmarkIndices.forEach((index) => {
      const current = map.get(index);
      if (current === "severe") {
        return;
      }
      map.set(index, metric.severity);
    });
  });
  return map;
}

function drawSagittalReference(
  context: CanvasRenderingContext2D,
  landmarks: Landmark[],
  view: ViewType,
  width: number,
  height: number,
) {
  const ankleIndex =
    view === "sagittal-left" ? POSE_LANDMARK.leftAnkle : POSE_LANDMARK.rightAnkle;
  const ankle = landmark(landmarks, ankleIndex);
  const x = ankle.x * width;
  context.save();
  context.strokeStyle = "#059669";
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(x, 0);
  context.lineTo(x, height);
  context.stroke();
  context.restore();
}

function drawFrontalReference(
  context: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
) {
  const shoulderMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftShoulder),
    landmark(landmarks, POSE_LANDMARK.rightShoulder),
  );
  const hipMid = midpoint(
    landmark(landmarks, POSE_LANDMARK.leftHip),
    landmark(landmarks, POSE_LANDMARK.rightHip),
  );
  const top = pointToCanvas(shoulderMid, width, height);
  const bottom = pointToCanvas(hipMid, width, height);

  context.save();
  context.strokeStyle = "#059669";
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(top.x, 0);
  context.lineTo(bottom.x, height);
  context.stroke();
  context.restore();
}

export function drawSkeletonSimple(
  context: CanvasRenderingContext2D,
  landmarks: Landmark[] | null,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);

  if (!landmarks) {
    return;
  }

  context.save();
  context.lineWidth = Math.max(2, width / 420);
  context.strokeStyle = "rgba(37, 99, 235, 0.9)";
  CONNECTIONS.forEach(([from, to]) => {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b) {
      return;
    }
    const start = pointToCanvas(a, width, height);
    const end = pointToCanvas(b, width, height);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  });
  context.restore();

  landmarks.forEach((point) => {
    const canvasPoint = pointToCanvas(point, width, height);
    context.beginPath();
    context.fillStyle = "#2563eb";
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.arc(canvasPoint.x, canvasPoint.y, Math.max(3, width / 180), 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });
}

export function drawPoseCanvas(
  canvas: HTMLCanvasElement,
  source: DrawableSource,
  landmarks: Landmark[] | null,
  view: ViewType,
  metrics: EvalMetric[] = [],
) {
  const size = sourceSize(source);
  const width = Math.max(1, Math.round(size.width));
  const height = Math.max(1, Math.round(size.height));
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  if (!landmarks) {
    return;
  }

  if (view.startsWith("sagittal")) {
    drawSagittalReference(context, landmarks, view, width, height);
  } else {
    drawFrontalReference(context, landmarks, width, height);
  }

  context.save();
  context.lineWidth = Math.max(2, width / 420);
  context.strokeStyle = "rgba(30, 58, 138, 0.85)";
  CONNECTIONS.forEach(([from, to]) => {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b) {
      return;
    }
    const start = pointToCanvas(a, width, height);
    const end = pointToCanvas(b, width, height);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  });
  context.restore();

  const highlights = highlightedLandmarks(metrics);
  landmarks.forEach((point, index) => {
    const canvasPoint = pointToCanvas(point, width, height);
    const severity = highlights.get(index);
    context.beginPath();
    context.fillStyle = severity ? severityColor(severity) : "#2563eb";
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.arc(canvasPoint.x, canvasPoint.y, severity ? 6 : 4, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });
}
