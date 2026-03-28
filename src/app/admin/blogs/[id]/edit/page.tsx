"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import BlogForm from "@/components/admin/BlogForm";
import { blogApi } from "@/lib/api";

export default function EditBlogPage() {
  const { id } = useParams() as { id: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-blog', id],
    // In our backend getAdminAll returns all blogs, but to get a specific one maybe we get by slug?
    // Wait, the API doesn't have an admin-specific "get by ID" method if the blog is DRAFT.
    // Our getBlogBySlug requires isPublished: true. 
    // We should probably hit `/blogs/admin/all` and filter client-side since there isn't a huge amount.
    queryFn: async () => {
      // Fetching up to 100 on admin all, realistically there aren't too many
      const res = await blogApi.getAdminAll({ limit: 100 });
      const found = res.data?.blogs?.find((b: any) => b._id === id);
      if (!found) {
        throw new Error("Blog not found");
      }
      return found;
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-6 text-red-500 font-medium">Failed to load blog data or blog not found.</div>;
  }

  return (
    <div className="p-6">
      <BlogForm initialData={data} />
    </div>
  );
}
