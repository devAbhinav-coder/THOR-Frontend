"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export default function AdminErrorState({
  title = "Couldn’t load data",
  message = "Check your connection and API URL, then try again.",
  onRetry,
  retryLabel = "Retry",
}: AdminErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/90 to-white px-5 py-10 text-center shadow-sm"
      role="alert"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1.5 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="mt-6 border-red-200 text-red-800 hover:bg-red-50"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
