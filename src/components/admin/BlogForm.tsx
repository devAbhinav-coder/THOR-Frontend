"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import { Blog, BlogImageLayout } from "@/types";
import CropModal from "./CropModal";
import BlogAdminPreview from "./BlogAdminPreview";
import BlogImageGalleryEditor, {
  galleryRowsFromBlog,
  galleryRowsToBlogImages,
  type GalleryRow,
} from "./BlogImageGalleryEditor";
import BlogStoryPlanner from "./BlogStoryPlanner";
import {
  AdminAiBlogDraftSection,
  type BlogCopyDraft,
} from "@/components/admin/ai/AdminAiBlogDraftSection";
import { BLOG_CATEGORIES, computeSeoScore } from "@/lib/blogHelpers";
import { aspectForLayout, defaultLayoutForIndex } from "@/lib/blogGridLayouts";
import { injectImagesIntoContent } from "@/lib/blogArticleCompose";

interface BlogFormProps {
  initialData?: Blog;
  prefill?: { topic?: string; keywords?: string; category?: string };
}

export default function BlogForm({ initialData, prefill }: BlogFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || "");
  const [keywordsText, setKeywordsText] = useState(
    (initialData?.keywords || []).join(", "),
  );
  const [tagsText, setTagsText] = useState((initialData?.tags || []).join(", "));
  const [category, setCategory] = useState(initialData?.category || "saree-styling");
  const [aiGenerated, setAiGenerated] = useState(initialData?.aiGenerated || false);
  const [aiPromptSnapshot, setAiPromptSnapshot] = useState(
    initialData?.aiPromptSnapshot || "",
  );
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [scheduledPublishAt, setScheduledPublishAt] = useState(
    initialData?.scheduledPublishAt ?
      new Date(initialData.scheduledPublishAt).toISOString().slice(0, 16)
    : "",
  );
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    (initialData?.relatedProductIds || [])
      .map((p) => (typeof p === "string" ? p : p._id))
      .filter(Boolean),
  );

  const seoScore = useMemo(
    () =>
      computeSeoScore({
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        keywords: keywordsText.split(",").map((k) => k.trim()).filter(Boolean),
        excerpt,
        content,
      }),
    [seoTitle, seoDescription, keywordsText, excerpt, content, title],
  );

  const [galleryRows, setGalleryRows] = useState<GalleryRow[]>(() =>
    galleryRowsFromBlog(initialData?.images || []),
  );
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cropping State
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);
  const [pendingCropLayout, setPendingCropLayout] = useState<BlogImageLayout>("hero");
  const [pendingCropPreviewUrl, setPendingCropPreviewUrl] = useState<string | null>(null);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const pendingCropKey =
    pendingCropFiles[0] ?
      `${pendingCropFiles[0].name}-${pendingCropFiles[0].size}-${pendingCropFiles[0].lastModified}`
    : null;

  useEffect(() => {
    if (!pendingCropFiles[0]) {
      setPendingCropPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingCropFiles[0]);
    setPendingCropPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingCropKey, pendingCropFiles]);

  const appendFiles = (files: File[]) => {
    const startIdx = galleryRows.length;
    const newRows: GalleryRow[] = files.map((file, offset) => {
      const idx = startIdx + offset;
      return {
        kind: "new",
        preview: URL.createObjectURL(file),
        file,
        caption: suggestedCaptions[idx] || "",
        layout: defaultLayoutForIndex(idx),
        placement: idx === 0 && galleryRows.length === 0 ? "cover" : "article",
      };
    });
    setGalleryRows((prev) => [...prev, ...newRows]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (galleryRows.length + filesArray.length > 10) {
        toast.error("You can upload a maximum of 10 images.");
        e.target.value = "";
        return;
      }
      setPendingCropLayout(defaultLayoutForIndex(galleryRows.length));
      setPendingCropFiles(filesArray);
      e.target.value = "";
    }
  };

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const filesArray = Array.from(e.target.files);
    if (galleryRows.length + filesArray.length > 10) {
      toast.error("You can upload a maximum of 10 images.");
      e.target.value = "";
      return;
    }
    appendFiles(filesArray);
    toast.success(`${filesArray.length} image(s) added — first image is cover (Hero)`);
    e.target.value = "";
  };

  const handleCropComplete = (croppedBlob: Blob | File) => {
    if (pendingCropFiles.length === 0) return;
    const currentFile = pendingCropFiles[0];
    
    let newFile: File;
    if (croppedBlob instanceof File) {
      newFile = croppedBlob;
    } else {
      newFile = new File([croppedBlob], currentFile.name, { type: 'image/jpeg' });
    }
    
    const captionIdx = galleryRows.length;
    setGalleryRows((prev) => [
      ...prev,
      {
        kind: "new",
        preview: URL.createObjectURL(croppedBlob),
        file: newFile,
        caption: suggestedCaptions[captionIdx] || "",
        layout: pendingCropLayout,
        placement: captionIdx === 0 ? "cover" : "article",
      },
    ]);

    setPendingCropLayout(defaultLayoutForIndex(captionIdx + 1));
    setPendingCropFiles((prev) => prev.slice(1));
  };

  const handleCropCancel = () => {
    setPendingCropLayout(defaultLayoutForIndex(galleryRows.length));
    setPendingCropFiles((prev) => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        toast("Skipped image — crop the next one or use Quick upload.", { icon: "ℹ️" });
      }
      return remaining;
    });
  };

  const clearPendingCropQueue = () => {
    setPendingCropFiles([]);
    setPendingCropLayout(defaultLayoutForIndex(galleryRows.length));
    toast.success("Crop queue cleared");
  };

  const handleRemoveExistingImage = async (publicId: string) => {
    if (!initialData) return;
    if (!confirm("Are you sure you want to permanently delete this image from the server?")) {
      return;
    }
    try {
      await blogApi.deleteImage(initialData._id, publicId);
      setGalleryRows((prev) =>
        prev.filter((row) => !(row.kind === "existing" && row.publicId === publicId)),
      );
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const previewImages = useMemo(
    () => galleryRowsToBlogImages(galleryRows),
    [galleryRows],
  );

  const previewTags = useMemo(
    () => tagsText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    [tagsText],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("content", content);
      formData.append("excerpt", excerpt);
      formData.append("seoTitle", seoTitle || title);
      formData.append("seoDescription", seoDescription || excerpt);
      formData.append(
        "keywords",
        JSON.stringify(
          keywordsText.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean),
        ),
      );
      formData.append(
        "tags",
        JSON.stringify(tagsText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)),
      );
      formData.append("category", category);
      formData.append("aiGenerated", String(aiGenerated));
      if (aiPromptSnapshot) formData.append("aiPromptSnapshot", aiPromptSnapshot);
      if (scheduledPublishAt) formData.append("scheduledPublishAt", new Date(scheduledPublishAt).toISOString());
      else formData.append("scheduledPublishAt", "");
      formData.append("relatedProductIds", JSON.stringify(relatedProductIds));
      formData.append("isPublished", isPublished.toString());

      const existingRows = galleryRows.filter((r) => r.kind === "existing");
      const newRows = galleryRows.filter((r) => r.kind === "new");

      if (isEditing) {
        formData.append(
          "existingImages",
          JSON.stringify(
            existingRows.map((r) => ({
              publicId: r.publicId,
              url: r.url,
              caption: r.caption,
              layout: r.layout,
              placement: r.placement,
            })),
          ),
        );
        if (newRows.length > 0) {
          newRows.forEach((r) => formData.append("images", r.file));
          formData.append("newCaptions", JSON.stringify(newRows.map((r) => r.caption)));
          formData.append("newLayouts", JSON.stringify(newRows.map((r) => r.layout)));
          formData.append("newPlacements", JSON.stringify(newRows.map((r) => r.placement)));
          formData.append("expectedImageCount", String(newRows.length));
        }
        return blogApi.update(initialData._id, formData, {
          onUploadProgress: (p) => setUploadProgress(p),
        });
      }

      if (newRows.length > 0) {
        newRows.forEach((r) => formData.append("images", r.file));
        formData.append("captions", JSON.stringify(newRows.map((r) => r.caption)));
        formData.append("layouts", JSON.stringify(newRows.map((r) => r.layout)));
        formData.append("placements", JSON.stringify(newRows.map((r) => r.placement)));
        formData.append("expectedImageCount", String(newRows.length));
      }
      return blogApi.create(formData, {
        onUploadProgress: (p) => setUploadProgress(p),
      });
    },
    onSettled: () => setUploadProgress(null),
    onSuccess: (res) => {
      const savedImages = (res as { data?: { blog?: { images?: unknown[] } } })?.data?.blog?.images;
      const newCount = galleryRows.filter((r) => r.kind === "new").length;
      if (newCount > 0 && (!savedImages || savedImages.length === 0)) {
        toast.error("Blog saved but images may be missing — please edit and re-upload.");
      } else {
        toast.success(`Blog ${isEditing ? "updated" : "created"} successfully!`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      router.push("/admin/blogs");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || `Failed to ${isEditing ? "update" : "create"} blog`);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingCropFiles.length > 0) {
      toast.error(
        `Please finish cropping ${pendingCropFiles.length} image(s) before saving.`,
      );
      return;
    }
    if (!title || !slug || !content) {
      toast.error("Please fill in all required fields (Title, Slug, Content)");
      return;
    }
    if (isPublished && galleryRows.length === 0) {
      toast.error("Add at least one cover image (Hero) before publishing.");
      return;
    }
    if (isPublished && !galleryRows.some((r) => r.placement === "cover")) {
      toast.error("Set one image as Cover / Hero before publishing.");
      return;
    }
    saveMutation.mutate();
  };

  const applyAiDraft = (draft: BlogCopyDraft) => {
    if (draft.title) setTitle(draft.title);
    if (draft.slug) setSlug(draft.slug);
    if (draft.content) {
      const slots = Math.max(draft.suggestedImageCaptions?.length || 0, 2);
      setContent(injectImagesIntoContent(draft.content, slots));
    }
    if (draft.suggestedImageCaptions?.length) {
      setSuggestedCaptions(draft.suggestedImageCaptions);
    }
    if (draft.excerpt) setExcerpt(draft.excerpt);
    if (draft.seoTitle) setSeoTitle(draft.seoTitle);
    if (draft.seoDescription) setSeoDescription(draft.seoDescription);
    if (draft.keywords?.length) setKeywordsText(draft.keywords.join(", "));
    if (draft.tags?.length) setTagsText(draft.tags.join(", "));
    if (draft.category) setCategory(draft.category);
    if (draft.aiPromptSnapshot) setAiPromptSnapshot(draft.aiPromptSnapshot);
    if (draft.linkProductIds?.length) setRelatedProductIds(draft.linkProductIds);
    setAiGenerated(true);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-[1500px] mx-auto grid xl:grid-cols-[1fr_420px] gap-8 xl:items-start">
    <div className="space-y-8 bg-white/70 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-8 gap-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-gray-900 drop-shadow-sm">
            {isEditing ? "Edit Journal Entry" : "Create New Journal"}
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Craft a beautiful story complete with vibrant imagery.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-col sm:items-end gap-2">
            <label className="flex items-center gap-2.5 text-sm text-gray-700 font-semibold bg-white shadow-sm px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 transition-colors"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              {isPublished ? "Published" : "Draft Status"}
            </label>
            <input
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={(e) => setScheduledPublishAt(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
              title="Schedule auto-publish"
            />
            {scheduledPublishAt && !isPublished && (
              <span className="text-[10px] text-emerald-700 font-medium">Auto-publish scheduled</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50"
          >
            {saveMutation.isPending ?
              <Loader2 className="w-5 h-5 animate-spin" />
            : <Save className="w-5 h-5" />}
            {uploadProgress != null && saveMutation.isPending ?
              `Uploading ${uploadProgress}%`
            : "Save Entry"}
          </button>
        </div>
      </div>

      <AdminAiBlogDraftSection onApply={applyAiDraft} prefill={prefill} />

      {/* Form Fields */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
            Story Title <span className="text-brand-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isEditing) {
                 setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
              }
            }}
            placeholder="e.g. The Legacy of Kalamkari"
            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 text-lg focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none transition-all placeholder:text-gray-300 shadow-inner"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
            <span>Slug <span className="text-brand-500">*</span></span>
            <span className="font-medium text-[11px] text-gray-400 normal-case">URL-friendly identifier</span>
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="the-legacy-of-kalamkari"
            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none transition-all placeholder:text-gray-300 shadow-inner"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none"
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
            Excerpt (listing card)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Short teaser for blog listing and Google..."
            className="w-full px-5 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 text-sm leading-relaxed focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none resize-y"
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
              SEO Preview
            </h3>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                seoScore.score >= 75 ?
                  "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
              }`}
            >
              Score {seoScore.score}/100
            </span>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-4 text-sm">
            <p className="text-[#1a0dab] text-base font-medium line-clamp-1">
              {seoTitle || title || "SEO Title"}
            </p>
            <p className="text-[#006621] text-xs mt-0.5">thehouseofrani.com › blog › {slug || "..."}</p>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {seoDescription || excerpt || "Meta description preview"}
            </p>
          </div>
          {seoScore.tips.length > 0 && (
            <ul className="text-xs text-emerald-800/80 space-y-1 list-disc pl-4">
              {seoScore.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">SEO Title</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Meta Description</label>
              <input
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Keywords (comma separated)</label>
              <input
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="banarasi saree, wedding styling, reception look"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Tags (comma separated)</label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="bridal, saree, styling"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
            <span>Content Body <span className="text-brand-500">*</span></span>
            <span className="font-medium text-[11px] text-gray-400 normal-case">
              Write your story — place photos visually in Story layout below
            </span>
          </label>
          <textarea
            ref={contentTextareaRef}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Once upon a time in the workshops of artisans..."
            className="w-full h-80 px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 text-base leading-relaxed focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none transition-all resize-y placeholder:text-gray-300 shadow-inner font-mono text-sm"
          />
        </div>
      </div>

      {/* Media Uploads */}
      <div className="space-y-6 pt-10 border-t border-gray-100 mt-6">
        <div>
          <div className="mb-6">
             <h3 className="text-xl font-bold font-serif text-gray-900 mb-2">Photos &amp; story layout</h3>
             <p className="text-sm text-gray-500 font-medium">
               Drag photos into the story map — cover, between paragraphs, or end gallery. Preview stays centered on the right.
             </p>
          </div>

          <div className="mb-6">
            <BlogStoryPlanner
              rows={galleryRows}
              onRowsChange={setGalleryRows}
              content={content}
              onContentChange={setContent}
              title={title}
              excerpt={excerpt}
            />
          </div>

          <div className="xl:hidden mb-8">
            <BlogAdminPreview
              title={title}
              slug={slug}
              content={content}
              excerpt={excerpt}
              category={category}
              tags={previewTags}
              images={previewImages}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
             <label className="group relative overflow-hidden inline-flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 px-6 py-8 rounded-3xl cursor-pointer transition-all w-full flex-1">
               <input
                 type="file"
                 multiple
                 accept="image/jpeg,image/png,image/webp,image/gif"
                 className="hidden"
                 onChange={handleFileSelect}
                 disabled={galleryRows.length >= 10}
               />
               <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                 <Plus className="w-8 h-8 text-brand-500" />
               </div>
               <span className="font-bold text-lg">Browse &amp; crop each image</span>
               <span className="text-xs font-semibold uppercase tracking-wider opacity-60 text-center">First image = cover hero · max 10</span>
             </label>
             <label className="inline-flex flex-col items-center justify-center gap-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 px-6 py-8 rounded-3xl cursor-pointer transition-all w-full sm:max-w-xs">
               <input
                 type="file"
                 multiple
                 accept="image/jpeg,image/png,image/webp,image/gif"
                 className="hidden"
                 onChange={handleQuickUpload}
                 disabled={galleryRows.length >= 10}
               />
               <span className="font-bold text-sm text-center">Quick upload (no crop)</span>
               <span className="text-[10px] uppercase tracking-wider opacity-70 text-center">Recommended if crop fails</span>
             </label>
          </div>
          {pendingCropFiles.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 -mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800 font-medium">
                {pendingCropFiles.length} image(s) waiting to crop — finish in the popup or clear queue.
              </p>
              <button
                type="button"
                onClick={clearPendingCropQueue}
                className="text-xs font-bold uppercase tracking-wide text-amber-900 hover:text-red-700 shrink-0"
              >
                Clear crop queue
              </button>
            </div>
          )}

          <BlogImageGalleryEditor
            rows={galleryRows}
            onRowsChange={setGalleryRows}
            content={content}
            onContentChange={setContent}
            onRemoveExisting={isEditing ? handleRemoveExistingImage : undefined}
            maxImages={10}
          />
        </div>
      </div>

    </div>

    <div className="hidden xl:block sticky top-0 h-[calc(100vh-2rem)] self-start">
      <div className="flex items-center h-full w-full py-4">
      <BlogAdminPreview
        title={title}
        slug={slug}
        content={content}
        excerpt={excerpt}
        category={category}
        tags={previewTags}
        images={previewImages}
      />
      </div>
    </div>

    {pendingCropPreviewUrl && pendingCropFiles.length > 0 && (
      <CropModal
        imageSrc={pendingCropPreviewUrl}
        originalFile={pendingCropFiles[0]}
        defaultAspect={aspectForLayout(pendingCropLayout)}
        queueLabel={`Image ${galleryRows.length + 1} of ${galleryRows.length + pendingCropFiles.length}`}
        onCropComplete={handleCropComplete}
        onClose={handleCropCancel}
      />
    )}
    </form>
  );
}
