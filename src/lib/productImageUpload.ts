import { adminApi } from "@/lib/api";

export type ProductImageUploadProgress = {
  percent: number;
  phase: "preparing" | "uploading" | "complete" | "error";
  loaded: number;
  total: number;
  index: number;
  count: number;
};

type CloudinarySignPayload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowed_formats?: string;
};

async function fetchImageSignature(
  kind: "gallery" | "premium-hero",
): Promise<CloudinarySignPayload> {
  const sigRes =
    kind === "premium-hero" ?
      await adminApi.getPremiumHeroUploadSignature()
    : await adminApi.getProductImageUploadSignature();
  const payload = sigRes.data as CloudinarySignPayload;
  if (
    !payload?.cloudName ||
    !payload?.apiKey ||
    !payload?.signature ||
    !payload?.folder
  ) {
    throw new Error("Could not start image upload. Try again.");
  }
  return payload;
}

function uploadOneImage(
  file: File,
  payload: CloudinarySignPayload,
  onXhrProgress?: (loaded: number, total: number) => void,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", payload.apiKey);
    fd.append("timestamp", String(payload.timestamp));
    fd.append("signature", payload.signature);
    fd.append("folder", payload.folder);
    if (payload.allowed_formats) {
      fd.append("allowed_formats", payload.allowed_formats);
    }

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onXhrProgress) return;
      onXhrProgress(event.loaded, event.total);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Image upload failed. Check file size and format."));
        return;
      }
      try {
        const json = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          public_id?: string;
        };
        if (!json.secure_url || !json.public_id) {
          throw new Error("Invalid upload response");
        }
        resolve({ url: json.secure_url, publicId: json.public_id });
      } catch {
        reject(new Error("Could not process uploaded image."));
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new Error(
          "Upload blocked or network failed. Refresh the page and try again.",
        ),
      );
    });

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${payload.cloudName}/image/upload`,
    );
    xhr.send(fd);
  });
}

/** Direct browser → Cloudinary gallery upload (signed). */
export async function uploadProductGalleryImages(
  files: File[],
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<{ url: string; publicId: string }[]> {
  if (!files.length) return [];
  const payload = await fetchImageSignature("gallery");
  const out: { url: string; publicId: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    onProgress?.({
      percent: Math.round((i / files.length) * 100),
      phase: "uploading",
      loaded: 0,
      total: file.size,
      index: i,
      count: files.length,
    });
    const uploaded = await uploadOneImage(file, payload, (loaded, total) => {
      const base = i / files.length;
      const slice = 1 / files.length;
      onProgress?.({
        percent: Math.min(99, Math.round((base + (loaded / total) * slice) * 100)),
        phase: "uploading",
        loaded,
        total,
        index: i,
        count: files.length,
      });
    });
    out.push(uploaded);
  }

  onProgress?.({
    percent: 100,
    phase: "complete",
    loaded: 1,
    total: 1,
    index: files.length - 1,
    count: files.length,
  });
  return out;
}

/** Direct browser → Cloudinary premium hero upload (signed). */
export async function uploadPremiumHeroImage(
  file: File,
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<{ url: string; publicId: string }> {
  const payload = await fetchImageSignature("premium-hero");
  onProgress?.({
    percent: 0,
    phase: "preparing",
    loaded: 0,
    total: file.size,
    index: 0,
    count: 1,
  });
  const uploaded = await uploadOneImage(file, payload, (loaded, total) => {
    onProgress?.({
      percent: Math.min(99, Math.round((loaded / total) * 100)),
      phase: "uploading",
      loaded,
      total,
      index: 0,
      count: 1,
    });
  });
  onProgress?.({
    percent: 100,
    phase: "complete",
    loaded: file.size,
    total: file.size,
    index: 0,
    count: 1,
  });
  return uploaded;
}
