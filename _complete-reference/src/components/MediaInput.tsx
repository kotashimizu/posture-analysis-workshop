import { CameraCapture } from "@/components/CameraCapture";
import { FileDropzone } from "@/components/FileDropzone";
import type { MediaMode } from "@/types";

type MediaInputProps = {
  mode: MediaMode;
  onFileAccepted: (file: File) => void;
  onImageCaptured: (canvas: HTMLCanvasElement, previewUrl: string) => void;
  onVideoCaptured: (blob: Blob) => void;
  onError: (message: string) => void;
};

export function MediaInput({
  mode,
  onFileAccepted,
  onImageCaptured,
  onVideoCaptured,
  onError,
}: MediaInputProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <FileDropzone mode={mode} onFileAccepted={onFileAccepted} onError={onError} />
      <CameraCapture
        mode={mode}
        onImageCaptured={onImageCaptured}
        onVideoCaptured={onVideoCaptured}
        onError={onError}
      />
    </div>
  );
}
