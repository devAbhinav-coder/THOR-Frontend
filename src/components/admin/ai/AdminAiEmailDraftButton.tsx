"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { adminAiApi } from "@/lib/adminAiApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAdminAiStatus, aiErrorMessage } from "./useAdminAi";

type Props = {
  /** Admin's message / notes — what they want the email to say */
  adminBrief?: string;
  subjectHint?: string;
  audience?: string;
  estimatedRecipients?: number;
  ctaText?: string;
  ctaLink?: string;
  onDraft: (subject: string, messageHtml: string) => void;
};

export function AdminAiEmailDraftButton({
  adminBrief = "",
  subjectHint,
  audience,
  estimatedRecipients,
  ctaText,
  ctaLink,
  onDraft,
}: Props) {
  const { status } = useAdminAiStatus();
  const [loading, setLoading] = useState(false);

  if (!status?.enabled) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-xl border-violet-200 bg-violet-50/40 text-violet-900 gap-1.5"
      disabled={loading}
      onClick={async () => {
        const brief = String(adminBrief ?? "").trim();
        if (brief.length < 10) {
          toast.error(
            "Pehle Message box mein likho: kya offer / collection / festival batana hai (kam se kam 1-2 lines).",
          );
          return;
        }
        setLoading(true);
        try {
          const res = await adminAiApi.draftMarketingEmail({
            adminBrief: brief,
            subjectHint: subjectHint?.trim() || undefined,
            audience,
            estimatedRecipients,
            ctaText: ctaText?.trim() || "Shop Now",
            ctaLink: ctaLink?.trim() || "/shop",
            tone: "warm, festive, trustworthy Indian ethnic wear",
          });
          const d = res.data as {
            subject?: string;
            messageHtml?: string;
            text?: string;
          };
          const subject =
            d.subject?.trim() ||
            d.text?.trim().slice(0, 70) ||
            "News from The House of Rani";
          const messageHtml =
            d.messageHtml?.trim() ||
            (d.text && !d.subject ? d.text.trim() : "");
          if (!messageHtml || messageHtml.length < 10) {
            throw new Error(
              "AI ne khali email bheji. Message box mein zyada detail likho aur dubara try karo.",
            );
          }
          onDraft(subject, messageHtml);
          toast.success("AI ne aapke brief se email likh di — review karke bhejein");
        } catch (e) {
          toast.error(aiErrorMessage(e));
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      AI draft from your notes
    </Button>
  );
}
