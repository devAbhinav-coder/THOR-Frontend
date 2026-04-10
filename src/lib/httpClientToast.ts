import toast from "react-hot-toast";

const STATUS_TOAST: Partial<Record<number, string>> = {
  403: "You do not have permission to perform this action.",
  429: "Too many requests. Please slow down.",
};

/** User-facing toast for non-401 HTTP errors from axios interceptors (aligned with backend status codes). */
export function toastForNonAuthHttpError(status: number | undefined): void {
  if (status === undefined) return;
  const specific = STATUS_TOAST[status];
  if (specific) {
    toast.error(specific);
    return;
  }
  if (status >= 500) {
    toast.error("Server error. Please try again later.");
  }
}
