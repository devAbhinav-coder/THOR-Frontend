import { z } from "zod";

const fallbackApi = "http://localhost:5000/api";

function readPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw) {
    const url = z.string().url().parse(raw);
    /** TLS encrypts passwords, tokens, and JSON in transit — required outside localhost. */
    if (
      process.env.NODE_ENV === "production" &&
      !url.toLowerCase().startsWith("https://")
    ) {
      throw new Error(
        "NEXT_PUBLIC_API_URL must use https:// in production so login, signup, and API data are encrypted in transit (TLS).",
      );
    }
    return url;
  }
  if (process.env.NODE_ENV !== "production") return fallbackApi;
  throw new Error(
    "NEXT_PUBLIC_API_URL is required in production (must be a valid URL, e.g. https://api.example.com/api)",
  );
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? z.string().url().parse(process.env.NEXT_PUBLIC_APP_URL)
  : undefined;

/** Validated public env — safe to import from client or server bundles. */
export const env = {
  NEXT_PUBLIC_API_URL: readPublicApiUrl(),
  NEXT_PUBLIC_APP_URL: appUrl,
} as const;
