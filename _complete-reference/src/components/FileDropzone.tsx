import { useRef, useState, type DragEvent } from "react";
import { FileImage, FileVideo, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaMode } from "@/types";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  mode: MediaMode;
  onFileAccepted: (file: File) => void;
  onError: (message: string) => void;
};

const ACCEPTED_TYPES: Record<MediaMode, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
};

const ACCEPT_ATTRIBUTE: Record<MediaMode, string> = {
  image: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  video: ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm",
};

function isSupportedFile(file: File, mode: MediaMode) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtensions = mode === "image" ? ["jpg", "jpeg", "png", "webp"] : ["mp4", "mov", "webm"];
  return ACCEPTED_TYPES[mode].includes(file.type) || validExtensions.includes(extension ?? "");
}

export function FileDropzone({ mode, onFileAccepted, onError }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const Icon = mode === "image" ? FileImage : FileVideo;

  const acceptFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!isSupportedFile(file, mode)) {
      onError(
        mode === "image"
          ? "対応形式はjpg、png、webpです。"
          : "対応形式はmp4、mov、webmです。",
      );
      return;
    }
    onFileAccepted(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed bg-white p-5 transition",
        dragActive ? "border-blue-800 bg-blue-50" : "border-slate-300",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={ACCEPT_ATTRIBUTE[mode]}
        onChange={(event) => acceptFile(event.currentTarget.files?.[0])}
      />
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-blue-900">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-950">
              {mode === "image" ? "画像をアップロード" : "動画をアップロード"}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {mode === "image"
                ? "jpg、png、webpをドラッグまたは選択します。"
                : "mp4、mov、webmをドラッグまたは選択します。30秒以下を推奨します。"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          ファイル選択
        </Button>
      </div>
    </div>
  );
}
