export function captureVideoFrame(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) {
    throw new Error("動画フレームを取得できません。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvasを初期化できません。");
  }
  context.drawImage(video, 0, 0, width, height);
  return canvas;
}

export function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const targetTime = Math.min(Math.max(time, 0), duration);
    if (Math.abs(video.currentTime - targetTime) < 0.01) {
      resolve();
      return;
    }

    const handleSeeked = () => {
      resolve();
    };
    video.addEventListener("seeked", handleSeeked, { once: true });
    try {
      video.currentTime = targetTime;
    } catch (error) {
      video.removeEventListener("seeked", handleSeeked);
      reject(error);
    }
  });
}
