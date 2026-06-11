"use client";

import { useSearchParams } from "next/navigation";
import BlogForm from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  const sp = useSearchParams();
  const prefill = {
    topic: sp.get("topic") || undefined,
    keywords: sp.get("keywords") || undefined,
    category: sp.get("category") || undefined,
  };

  return (
    <div className="p-6">
      <BlogForm prefill={prefill} />
    </div>
  );
}
