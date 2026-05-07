export type MediaMode = "image" | "video";

export type ViewType =
  | "sagittal-left"
  | "sagittal-right"
  | "frontal-front"
  | "frontal-back";

export type Severity = "normal" | "mild" | "severe";

export type PostureType =
  | "ideal"
  | "kyphosis-lordosis"
  | "flat-back"
  | "sway-back"
  | "lordosis"
  | "unclassified";

export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type MetricDirection =
  | "neutral"
  | "forward"
  | "backward"
  | "anterior"
  | "posterior"
  | "flexion"
  | "hyperextension"
  | "left"
  | "right"
  | "medial"
  | "lateral";

export type EvalMetric = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit: "deg" | "percent" | "score";
  severity: Severity;
  summary: string;
  direction: MetricDirection;
  landmarkIndices: number[];
};

export type EvalResult = {
  view: ViewType;
  postureType: PostureType | null;
  metrics: EvalMetric[];
  findings: string[];
};

export type DetectionState = "idle" | "loading" | "ready" | "error";

export type MediaSource =
  | {
      kind: "image";
      url: string;
      element: HTMLImageElement;
    }
  | {
      kind: "canvas";
      url: string;
      element: HTMLCanvasElement;
    };

export type VideoSource = {
  url: string;
  fileName: string;
};
