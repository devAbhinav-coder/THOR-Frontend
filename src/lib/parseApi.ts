import { z } from "zod";
import type { AxiosResponse } from "axios";

export class ApiValidationError extends Error {
  constructor(
    public readonly label: string,
    public readonly zodError: z.ZodError,
  ) {
    super(`Invalid API response (${label})`);
    this.name = "ApiValidationError";
  }
}

export function parseApiResponse<T>(label: string, data: unknown, schema: z.ZodType<T>): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined") {
      console.error(`[parseApi] ${label}`, r.error.flatten());
    }
    throw new ApiValidationError(label, r.error);
  }
  return r.data;
}

export async function unwrapAxios<T>(
  label: string,
  promise: Promise<AxiosResponse<unknown>>,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await promise;
  return parseApiResponse(label, res.data, schema);
}
