"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";

type Props = {
  reviewId: string;
  onDraft: (text: string) => void;
};

export function AdminAiReviewDraftButton({ reviewId, onDraft }: Props) {
  const { status } = useAdminAiStatus();
  const [loading, setLoading] = useState(false);

  if (!status?.enabled) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-lg border-violet-200 text-violet-900 gap-1 text-xs h-8"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await adminAiApi.draftReviewReply(reviewId);
          const d = res.data as { replyText?: string; text?: string };
          const text = d.replyText || d.text || "";
          if (!text) throw new Error("Empty draft");
          onDraft(text);
          toast.success("Reply draft ready — edit & send");
        } catch (e) {
          toast.error(aiErrorMessage(e));
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      AI draft
    </Button>
  );
}
