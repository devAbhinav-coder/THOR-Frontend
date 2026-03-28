"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, Crop as CropIcon } from "lucide-react";

interface CropModalProps {
  imageSrc: string;
  originalFile: File;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob | File) => void;
}

const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: 1 },
  { label: "4:3 (Landscape)", value: 4 / 3 },
  { label: "3:4 (Portrait)", value: 3 / 4 },
  { label: "16:9 (Cinema)", value: 16 / 9 },
  { label: "Free (Any)", value: undefined },
];

export default function CropModal({ imageSrc, originalFile, onClose, onCropComplete }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoomValue: number) => {
    setZoom(zoomValue);
  };

  const onCropCompleteEvent = useCallback(
    (_croppedArea: Area, croppedAreaPx: Area) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const useOriginalFile = () => {
    onCropComplete(originalFile);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CropIcon className="w-5 h-5 text-brand-600" /> Adjust Image Shape
            </h3>
            <p className="text-xs text-gray-500 font-medium">Drag to reposition. Select an aspect ratio below to fit the layout.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full flex-1 min-h-[50vh] sm:min-h-[60vh] bg-[#0a0f1c] touch-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={onZoomChange}
            showGrid={true}
            style={{ containerStyle: { width: '100%', height: '100%' } }}
          />
        </div>

        {/* Aspect Ratio Selector */}
        <div className="p-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              onClick={() => setAspect(ratio.value)}
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                aspect === ratio.value
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5 bg-gray-50 flex flex-col sm:flex-row items-center gap-4 justify-between shrink-0">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="w-full accent-brand-600"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <button
               onClick={useOriginalFile}
               className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 shadow-sm transition-colors w-full sm:w-auto order-3 sm:order-1"
               title="Use the original photo without any cropping"
            >
               Skip Crop
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto order-2"
            >
              Cancel 
            </button>
            <button
              onClick={createCroppedImage}
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 w-full sm:w-auto order-1 sm:order-3"
            >
              {isProcessing ? "Processing..." : "Crop & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function to crop canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
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
    pixelCrop.height
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
