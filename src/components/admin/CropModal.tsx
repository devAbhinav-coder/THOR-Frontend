"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper, { Area } from "react-easy-crop";
import { X, Crop as CropIcon } from "lucide-react";

interface CropModalProps {
  imageSrc: string;
  originalFile: File;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob | File) => void;
  defaultAspect?: number;
  queueLabel?: string;
}

const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: 1 },
  { label: "4:3 (Landscape)", value: 4 / 3 },
  { label: "3:4 (Portrait)", value: 3 / 4 },
  { label: "16:9 (Cinema)", value: 16 / 9 },
  { label: "Free (Any)", value: undefined },
];

const CROP_AREA_HEIGHT = "min(52vh, 500px)";

export default function CropModal({
  imageSrc,
  originalFile,
  onClose,
  onCropComplete,
  defaultAspect = 4 / 3,
  queueLabel,
}: CropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    setAspect(defaultAspect);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropperReady(false);
  }, [imageSrc, defaultAspect]);

  const onCropCompleteEvent = useCallback(
    (_croppedArea: Area, croppedAreaPx: Area) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    [],
  );

  const onMediaLoaded = useCallback(() => {
    setCropperReady(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleAspectChange = (value: number | undefined) => {
    setAspect(value);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) {
      onCropComplete(originalFile);
      return;
    }
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      } else {
        onCropComplete(originalFile);
      }
    } catch (e) {
      console.error(e);
      onCropComplete(originalFile);
    } finally {
      setIsProcessing(false);
    }
  };

  const useOriginalFile = () => {
    onCropComplete(originalFile);
  };

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex flex-col min-w-0">
            <h3
              id="crop-modal-title"
              className="font-bold text-gray-900 flex items-center gap-2"
            >
              <CropIcon className="w-5 h-5 text-brand-600 shrink-0" />
              Adjust Image Shape
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Drag to reposition · pinch or slider to zoom · pick aspect ratio below
              {queueLabel ? ` · ${queueLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
            aria-label="Close crop dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="relative w-full bg-[#111827] touch-none shrink-0"
          style={{ height: CROP_AREA_HEIGHT, minHeight: 320 }}
        >
          <Cropper
            key={`${imageSrc}-${aspect ?? "free"}`}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={setZoom}
            onMediaLoaded={onMediaLoaded}
            showGrid
            zoomWithScroll
            restrictPosition={false}
            objectFit="contain"
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
              cropAreaStyle: {
                border: "2px solid rgba(255,255,255,0.85)",
              },
            }}
          />
          {!cropperReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
              Loading image…
            </div>
          )}
        </div>

        <div className="p-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              type="button"
              onClick={() => handleAspectChange(ratio.value)}
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                aspect === ratio.value ?
                  "bg-brand-600 border-brand-600 text-white"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5 bg-gray-50 flex flex-col sm:flex-row items-center gap-4 justify-between shrink-0">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
              Zoom
            </span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={useOriginalFile}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 shadow-sm transition-colors w-full sm:w-auto"
              title="Use the original photo without any cropping"
            >
              Skip Crop
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createCroppedImage}
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              {isProcessing ? "Processing…" : "Crop & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg", 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
