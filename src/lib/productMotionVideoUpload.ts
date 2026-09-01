import { adminApi } from "@/lib/api";

export type MotionVideoUploadProgress = {
  percent: number;
  phase: "preparing" | "uploading" | "processing" | "complete" | "error";
  loaded: number;
  total: number;
};

const MAX_MOTION_VIDEO_BYTES = 40 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export function validateMotionVideoFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
    return "Use MP4, WebM, or MOV only.";
  }
  if (file.size > MAX_MOTION_VIDEO_BYTES) {
    return "Video must be 40 MB or smaller.";
  }
  return null;
}

export async function uploadProductMotionVideo(
  file: File,
  onProgress: (progress: MotionVideoUploadProgress) => void,
): Promise<{ url: string; publicId: string }> {
  const validationError = validateMotionVideoFile(file);
  if (validationError) throw new Error(validationError);

  onProgress({
    percent: 0,
    phase: "preparing",
    loaded: 0,
    total: file.size,
  });

  const sigRes = await adminApi.getMotionVideoUploadSignature();
  const payload = sigRes.data as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  };

  if (
    !payload?.cloudName ||
    !payload?.apiKey ||
    !payload?.signature ||
    !payload?.folder
  ) {
    throw new Error("Could not start video upload. Try again.");
  }

  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", payload.apiKey);
    fd.append("timestamp", String(payload.timestamp));
    fd.append("signature", payload.signature);
    fd.append("folder", payload.folder);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const ratio = event.loaded / event.total;
      onProgress({
        percent: Math.min(92, Math.round(ratio * 92)),
        phase: "uploading",
        loaded: event.loaded,
        total: event.total,
      });
    });

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        onProgress({
          percent: 0,
          phase: "error",
          loaded: 0,
          total: file.size,
        });
        reject(new Error("Video upload failed. Check file size and format."));
        return;
      }

      onProgress({
        percent: 96,
        phase: "processing",
        loaded: file.size,
        total: file.size,
      });

      try {
        const json = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          public_id?: string;
        };
        if (!json.secure_url || !json.public_id) {
          throw new Error("Invalid upload response");
        }
        onProgress({
          percent: 100,
          phase: "complete",
          loaded: file.size,
          total: file.size,
        });
        resolve({ url: json.secure_url, publicId: json.public_id });
      } catch {
        onProgress({
          percent: 0,
          phase: "error",
          loaded: 0,
          total: file.size,
        });
        reject(new Error("Could not process uploaded video."));
      }
    });

    xhr.addEventListener("error", () => {
      onProgress({
        percent: 0,
        phase: "error",
        loaded: 0,
        total: file.size,
      });
      reject(
        new Error(
          "Upload blocked or network failed. Refresh the page and try again.",
        ),
      );
    });

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${payload.cloudName}/video/upload`,
    );
    xhr.send(fd);
  });
}

export function formatUploadBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
