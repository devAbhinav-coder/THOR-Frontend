"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Film, Loader2, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  formatUploadBytes,
  uploadProductMotionVideo,
  validateMotionVideoFile,
  type MotionVideoUploadProgress,
} from "@/lib/productMotionVideoUpload";

type ProductMotionVideoUploaderProps = {
  videoUrl: string;
  videoPublicId: string;
  clearRequested: boolean;
  onChange: (next: {
    url: string;
    publicId: string;
    clear: boolean;
  }) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

function clearPreviewUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function ProductMotionVideoUploader({
  videoUrl,
  videoPublicId,
  clearRequested,
  onChange,
  onUploadingChange,
}: ProductMotionVideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [progress, setProgress] = useState<MotionVideoUploadProgress | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const effectiveUrl = clearRequested ? "" : videoUrl.trim();
  const hasSavedVideo = Boolean(effectiveUrl);
  const previewSrc =
    !clearRequested && (localPreview || effectiveUrl) ?
      localPreview || effectiveUrl
    : null;

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    previewRef.current = localPreview;
    return () => {
      clearPreviewUrl(previewRef.current);
    };
  }, [localPreview]);

  const resetLocalAttempt = useCallback(() => {
    clearPreviewUrl(localPreview);
    setLocalPreview(null);
    setSelectedName(null);
    setProgress(null);
    setUploadError(null);
  }, [localPreview]);

  const startUpload = useCallback(
    async (file: File) => {
      const err = validateMotionVideoFile(file);
      if (err) {
        toast.error(err);
        return;
      }

      clearPreviewUrl(localPreview);
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);
      setSelectedName(file.name);
      setUploadError(null);
      setIsUploading(true);
      setProgress({
        percent: 0,
        phase: "preparing",
        loaded: 0,
        total: file.size,
      });

      try {
        const result = await uploadProductMotionVideo(file, setProgress);
        onChange({
          url: result.url,
          publicId: result.publicId,
          clear: false,
        });
        clearPreviewUrl(previewUrl);
        setLocalPreview(null);
        setSelectedName(null);
        toast.success("Motion video uploaded");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Video upload failed";
        clearPreviewUrl(previewUrl);
        setLocalPreview(null);
        setSelectedName(null);
        setUploadError(msg);
        setProgress({
          percent: 0,
          phase: "error",
          loaded: 0,
          total: file.size,
        });
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [localPreview, onChange],
  );

  const onPickFile = (file: File | null | undefined) => {
    if (!file || isUploading) return;
    void startUpload(file);
  };

  const handleRemove = () => {
    resetLocalAttempt();
    onChange({ url: "", publicId: "", clear: true });
  };

  const phaseLabel =
    progress?.phase === "preparing" ? "Preparing secure upload…"
    : progress?.phase === "uploading" ? "Uploading to CDN…"
    : progress?.phase === "processing" ? "Processing video…"
    : progress?.phase === "complete" ? "Upload complete"
    : progress?.phase === "error" ? "Upload failed"
    : null;

  return (
    <div className="space-y-3">
      {hasSavedVideo ?
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              Motion video saved
            </p>
            <p className="mt-0.5 truncate text-xs text-emerald-800/80">
              Ready for storefront · any aspect ratio
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      : null}

      {uploadError && !isUploading ?
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Upload did not complete</p>
            <p className="mt-0.5 text-xs text-red-700/90">{uploadError}</p>
            <button
              type="button"
              onClick={resetLocalAttempt}
              className="mt-2 text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
            >
              Dismiss & try again
            </button>
          </div>
        </div>
      : null}

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onPickFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isUploading) inputRef.current?.click();
          }
        }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver ?
            "border-brand-500 bg-brand-50/50"
          : "border-gray-200 bg-gray-50/60 hover:border-brand-300 hover:bg-brand-50/30",
          isUploading && "pointer-events-none opacity-80",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
          {isUploading ?
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          : hasSavedVideo ?
            <Film className="h-5 w-5 text-brand-600" />
          : <Upload className="h-5 w-5 text-brand-600" />}
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-800">
          {hasSavedVideo ?
            "Replace motion video"
          : "Drop video here or click to upload"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Any size · MP4 / WebM / MOV · max 40 MB
        </p>
        {selectedName && !hasSavedVideo ?
          <p className="mt-2 truncate text-xs font-medium text-gray-600">
            {selectedName}
          </p>
        : null}
      </div>

      {previewSrc ?
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
          <video
            src={previewSrc}
            controls
            playsInline
            className="max-h-72 w-full object-contain"
          />
          {!hasSavedVideo && !isUploading ?
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-500">Preview only — not saved yet</p>
              <button
                type="button"
                onClick={resetLocalAttempt}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            </div>
          : null}
        </div>
      : null}

      {progress && (isUploading || progress.phase === "error") ?
        <div
          className={cn(
            "rounded-xl border bg-white p-4 shadow-sm",
            progress.phase === "error" ?
              "border-red-100"
            : "border-gray-100",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span
              className={cn(
                "font-semibold",
                progress.phase === "error" ? "text-red-700" : "text-gray-700",
              )}
            >
              {phaseLabel}
            </span>
            {progress.phase !== "error" ?
              <span className="tabular-nums font-bold text-brand-700">
                {progress.percent}%
              </span>
            : null}
          </div>
          {progress.phase !== "error" ?
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-[#c5a059] transition-[width] duration-200 ease-out"
                style={{ width: `${Math.max(progress.percent, 3)}%` }}
              />
            </div>
          : null}
          <p className="mt-2 text-[11px] text-gray-500">
            {formatUploadBytes(progress.loaded)} /{" "}
            {formatUploadBytes(progress.total)}
            {progress.phase === "uploading" ?
              " · uploading to Cloudinary"
            : null}
          </p>
        </div>
      : null}

      {progress?.phase === "complete" && !isUploading && hasSavedVideo ?
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <Check className="h-4 w-4 shrink-0" />
          Video uploaded — click Save changes on the product to publish.
        </div>
      : null}

      {videoPublicId && hasSavedVideo ?
        <p className="text-[11px] text-gray-400">CDN ID: {videoPublicId}</p>
      : null}
    </div>
  );
}
