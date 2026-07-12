'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Upload, X, AlertCircle, CheckCircle2, ZoomIn, ZoomOut, Crop, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '4:5' | '5:1';

interface PreviewFile {
  id: string;
  file: File;
  url: string;
  size: number;
  name: string;
}

interface ImageUploaderProps {
  maxFiles?: number;
  aspectRatio?: AspectRatio;
  maxSizeMB?: number;
  existingImages?: string[];
  /** When set, each existing thumbnail shows a remove control (e.g. edit product in admin). */
  onRemoveExisting?: (index: number) => void | Promise<void>;
  onChange: (files: File[]) => void;
  label?: string;
  hint?: string;
  className?: string;
  /** Parent form save: show upload progress overlay (0–100). */
  uploadProgress?: number | null;
  isUploading?: boolean;
}

const RATIO_NUM: Record<AspectRatio, number> = {
  '1:1': 1,
  '3:4': 3 / 4,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '4:5': 4 / 5,
  '5:1': 5 / 1,
};

const RATIO_CSS: Record<AspectRatio, string> = {
  '1:1': '1/1',
  '3:4': '3/4',
  '4:3': '4/3',
  '16:9': '16/9',
  '4:5': '4/5',
  '5:1': '5/1',
};

const RATIO_LABEL: Record<AspectRatio, string> = {
  '1:1': '1:1 square',
  '3:4': '3:4 portrait',
  '4:3': '4:3 landscape',
  '16:9': '16:9 wide',
  '4:5': '4:5 portrait',
  '5:1': '5:1 banner',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const img = new window.Image();
  img.src = imageSrc;
  await new Promise<void>((res) => { img.onload = () => res(); });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  return new Promise((res) =>
    canvas.toBlob(
      (blob) => res(new File([blob!], 'cropped.jpg', { type: 'image/jpeg' })),
      'image/jpeg', 0.95,
    )
  );
}

export default function ImageUploader({
  maxFiles = 1,
  aspectRatio = '3:4',
  maxSizeMB = 5,
  existingImages = [],
  onRemoveExisting,
  onChange,
  label,
  hint,
  className,
  uploadProgress = null,
  isUploading = false,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [removingExistingIdx, setRemovingExistingIdx] = useState<number | null>(null);

  /* crop modal state */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOriginalName, setCropOriginalName] = useState('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [pendingCropQueue, setPendingCropQueue] = useState<File[]>([]);
  const [cropBatchTotal, setCropBatchTotal] = useState(0);
  const [cropBatchIndex, setCropBatchIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const previewsRef = useRef<PreviewFile[]>([]);

  const commitPreviews = useCallback((next: PreviewFile[]) => {
    previewsRef.current = next;
    setPreviews(next);
    onChangeRef.current(next.map((p) => p.file));
  }, []);

  const maxBytes = maxSizeMB * 1024 * 1024;
  const total = existingImages.length + previews.length;
  const slotsLeft = Math.max(0, maxFiles - total);
  const canAddMore = slotsLeft > 0;
  const aspectCss = RATIO_CSS[aspectRatio];
  const showUploadOverlay = isUploading || (uploadProgress != null && uploadProgress >= 0);

  const revokeCropSrc = (src: string | null) => {
    if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
  };

  const startCropForFile = (file: File) => {
    setCropSrc((prev) => {
      revokeCropSrc(prev);
      return URL.createObjectURL(file);
    });
    setCropOriginalName(file.name);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const closeCropModal = () => {
    revokeCropSrc(cropSrc);
    setCropSrc(null);
    setPendingCropQueue([]);
    setCropBatchTotal(0);
    setCropBatchIndex(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const processFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles?.length) return;

      const currentTotal =
        existingImages.length + previewsRef.current.length;
      const remaining = maxFiles - currentTotal;
      if (remaining <= 0) {
        setErrors([`Maximum ${maxFiles} image${maxFiles > 1 ? 's' : ''} allowed`]);
        return;
      }

      const newErrors: string[] = [];
      const valid: File[] = [];

      Array.from(rawFiles)
        .slice(0, remaining)
        .forEach((file) => {
          if (!file.type.startsWith('image/')) {
            newErrors.push(`${file.name}: not an image`);
            return;
          }
          if (file.size > maxBytes) {
            newErrors.push(`${file.name}: exceeds ${maxSizeMB} MB`);
            return;
          }
          valid.push(file);
        });

      if (rawFiles.length > remaining) {
        newErrors.push(
          `Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added (max ${maxFiles}).`,
        );
      }

      setErrors(newErrors);
      if (valid.length === 0) return;

      if (cropSrc) {
        setPendingCropQueue((q) => [...q, ...valid]);
        setCropBatchTotal((t) => t + valid.length);
        return;
      }

      const [first, ...rest] = valid;
      setPendingCropQueue(rest);
      setCropBatchTotal(valid.length);
      setCropBatchIndex(1);
      startCropForFile(first);
    },
    [existingImages.length, previews.length, maxFiles, maxBytes, maxSizeMB, cropSrc],
  );

  const advanceCropQueue = () => {
    setPendingCropQueue((queue) => {
      if (queue.length === 0) {
        queueMicrotask(() => closeCropModal());
        return [];
      }
      const [next, ...rest] = queue;
      queueMicrotask(() => {
        setCropBatchIndex((i) => i + 1);
        startCropForFile(next);
      });
      return rest;
    });
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropLoading(true);
    try {
      const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels);
      const newPreview: PreviewFile = {
        id: `${Date.now()}-${Math.random()}`,
        file: croppedFile,
        url: URL.createObjectURL(croppedFile),
        size: croppedFile.size,
        name: cropOriginalName,
      };
      commitPreviews([...previewsRef.current, newPreview]);
      revokeCropSrc(cropSrc);
      setCropSrc(null);
      advanceCropQueue();
    } finally {
      setCropLoading(false);
    }
  };

  const handleCropSkip = () => {
    revokeCropSrc(cropSrc);
    setCropSrc(null);
    advanceCropQueue();
  };

  const handleCropCancelAll = () => {
    closeCropModal();
  };

  const removePreview = (id: string) => {
    const removed = previews.find((p) => p.id === id);
    if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
    commitPreviews(previewsRef.current.filter((p) => p.id !== id));
  };

  const handleRemoveExisting = async (index: number) => {
    if (!onRemoveExisting || removingExistingIdx !== null) return;
    setRemovingExistingIdx(index);
    try {
      await Promise.resolve(onRemoveExisting(index));
    } finally {
      setRemovingExistingIdx(null);
    }
  };

  const cropModalOpen = cropSrc != null;
  const cropStepLabel =
    cropBatchTotal > 1 ? `${cropBatchIndex} of ${cropBatchTotal}` : null;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <span className="text-xs text-gray-400">
            {RATIO_LABEL[aspectRatio]} · max {maxSizeMB} MB
            {maxFiles > 1 && ` · ${total}/${maxFiles} images`}
          </span>
        </div>
      )}

      {/* Slot counter */}
      {maxFiles > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[120px] h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (total / maxFiles) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 tabular-nums">
            {total}/{maxFiles}
            {canAddMore && (
              <span className="text-gray-400 font-normal">
                {' '}
                · {slotsLeft} slot{slotsLeft === 1 ? '' : 's'} left
              </span>
            )}
          </span>
        </div>
      )}

      {/* ── Upload zone ── */}
      {canAddMore && !showUploadOverlay && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
          className={cn(
            'relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 p-6 sm:p-8 text-center select-none',
            isDragging ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50',
          )}
        >
          <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center transition-colors', isDragging ? 'bg-brand-100' : 'bg-white shadow-sm')}>
            <Upload className={cn('h-7 w-7 transition-colors', isDragging ? 'text-brand-600' : 'text-gray-400')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG, WEBP
              {maxFiles > 1 && (
                <>
                  {' '}
                  · select up to <strong>{slotsLeft}</strong> at once
                </>
              )}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={maxFiles > 1 && slotsLeft > 1}
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>
      )}

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <ul className="space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* ── Preview grid ── */}
      {(existingImages.length > 0 || previews.length > 0) && (
        <div className="relative">
          {showUploadOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm p-4">
              <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
              <div className="w-full max-w-xs space-y-2 text-center">
                <p className="text-sm font-semibold text-gray-800">Uploading images…</p>
                {uploadProgress != null && (
                  <>
                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-brand-600 transition-all duration-150 rounded-full"
                        style={{ width: `${Math.min(100, uploadProgress)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 tabular-nums">{uploadProgress}%</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div
            className={cn(
              'grid gap-3 w-full',
              maxFiles === 1 ? 'grid-cols-1'
              : maxFiles <= 3 ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
            )}
          >
            {existingImages.map((url, i) => (
              <div
                key={`ex-${url}-${i}`}
                className={cn(
                  'relative rounded-xl overflow-hidden bg-[#f0ebe4] group',
                  removingExistingIdx === i && 'opacity-60 pointer-events-none',
                )}
                style={{ aspectRatio: aspectCss }}
              >
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-contain"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  {onRemoveExisting ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemoveExisting(i);
                      }}
                      disabled={removingExistingIdx !== null}
                      className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-full">Current</span>
                  )}
                </div>
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-full font-medium">{i + 1}</span>
                </div>
              </div>
            ))}

            {previews.map((p, i) => (
              <div
                key={p.id}
                className="relative rounded-xl overflow-hidden bg-[#f0ebe4] group"
                style={{ aspectRatio: aspectCss }}
              >
                <Image
                  src={p.url}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-contain"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePreview(p.id); }}
                    className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
                    aria-label="Remove new image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-white text-xs font-medium">{formatBytes(p.size)}</span>
                </div>
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">New</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5">
                  <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-full font-medium">
                    {existingImages.length + i + 1}
                  </span>
                </div>
              </div>
            ))}

            {!canAddMore && maxFiles > 1 && (
              <div
                className="rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-not-allowed"
                style={{ aspectRatio: aspectCss }}
              >
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-xs text-green-600 font-medium text-center px-2">All {maxFiles} slots filled</span>
              </div>
            )}
          </div>
        </div>
      )}

      {hint && <p className="text-xs text-gray-400">{hint}</p>}

      {/* ── Crop Modal ── */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[95vh]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <Crop className="w-4 h-4 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    Crop image{cropStepLabel ? ` (${cropStepLabel})` : ''}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {RATIO_LABEL[aspectRatio]}
                    {pendingCropQueue.length > 0 && (
                      <> · {pendingCropQueue.length} more in queue</>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCropCancelAll}
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0"
                aria-label="Cancel all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-[#111] min-h-[240px] flex-1" style={{ height: 'min(340px, 50vh)' }}>
              <Cropper
                image={cropSrc!}
                crop={crop}
                zoom={zoom}
                aspect={RATIO_NUM[aspectRatio]}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                style={{
                  cropAreaStyle: { border: '2px solid #e8604c', borderRadius: 8 },
                }}
              />
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.02}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full accent-brand-600 cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-400 text-center mt-1.5">
                Drag to reposition · use slider to zoom
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCropSkip}
                className="sm:flex-1 border border-gray-200 bg-white text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleCropCancelAll}
                className="sm:flex-1 border border-gray-200 bg-white text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel all
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={cropLoading || !croppedAreaPixels}
                className="sm:flex-[1.2] bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {cropLoading ?
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                : <>
                    <Crop className="w-4 h-4" />
                    {pendingCropQueue.length > 0 ? 'Apply & next' : 'Apply & add'}
                  </>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
