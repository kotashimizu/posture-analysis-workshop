export async function requestCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("このブラウザではカメラ機能を利用できません。");
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 720 },
      height: { ideal: 1280 },
      aspectRatio: { ideal: 9 / 16 },
      facingMode: "environment",
    },
    audio: false,
  });
}

export function stopCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
