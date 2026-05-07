import { useState } from "react";
import type { DetectionState } from "@/types";

export function useMediaPipeStatus() {
  const [state, setState] = useState<DetectionState>("idle");
  const [message, setMessage] = useState("MediaPipeは未初期化です。");
  const [error, setError] = useState<string | null>(null);

  return {
    state,
    message,
    error,
    setState,
    setMessage,
    setError,
  };
}
