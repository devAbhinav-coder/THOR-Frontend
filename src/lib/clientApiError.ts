/** Shape returned by `api` axios interceptor (not always `AxiosError`). */
export type ClientApiErrorShape = {
  message?: string;
  status?: number;
  retryAfter?: number;
};

export function getClientApiError(err: unknown): ClientApiErrorShape {
  if (err && typeof err === "object") {
    const o = err as ClientApiErrorShape & {
      response?: { status?: number; data?: { message?: string } };
    };
    if (typeof o.message === "string" && typeof o.status === "number") {
      return {
        message: o.message,
        status: o.status,
        retryAfter: o.retryAfter,
      };
    }
    const axiosStatus = o.response?.status;
    const axiosMsg = o.response?.data?.message;
    if (typeof axiosStatus === "number") {
      return {
        message:
          typeof axiosMsg === "string" && axiosMsg ?
            axiosMsg
          : "Request failed",
        status: axiosStatus,
      };
    }
    if (typeof o.message === "string" && o.message) {
      return { message: o.message };
    }
  }
  if (err instanceof Error && err.message) {
    return { message: err.message };
  }
  return { message: "Something went wrong. Please try again." };
}

export function formatClientApiErrorMessage(err: unknown): string {
  const { message, retryAfter } = getClientApiError(err);
  const base = message || "Something went wrong. Please try again.";
  if (retryAfter != null && retryAfter > 0) {
    return `${base} Try again in ${retryAfter}s.`;
  }
  return base;
}
