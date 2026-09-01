"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Loader2, ChevronDown, Search, Eye } from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import CropModal from "./CropModal";
import BlogPreviewModal from "./BlogPreviewModal";
import BlogImageGalleryEditor, {
  galleryRowsFromBlog,
  galleryRowsToBlogImages,
  type GalleryRow,
} from "./BlogImageGalleryEditor";
import {
  AdminAiBlogDraftSection,
  type BlogCopyDraft,
} from "@/components/admin/ai/AdminAiBlogDraftSection";
import { BLOG_CATEGORIES, computeSeoScore } from "@/lib/blogHelpers";
import { aspectForLayout, defaultLayoutForIndex } from "@/lib/blogGridLayouts";
import { injectImagesIntoContent } from "@/lib/blogArticleCompose";
import { normalizeBlogStorageContent } from "@/lib/blogContentEditor";
import { imageRowPartner, imageInStoryRow } from "@/lib/blogStoryPlanner";
import { Blog, BlogImageLayout } from "@/types";
import BlogRichTextEditor, { type BlogRichTextEditorHandle } from "./BlogRichTextEditor";
import BlogMediaLibraryModal from "./BlogMediaLibraryModal";
import BlogMediaSidebar from "./BlogMediaSidebar";
import { setCoverOnRows } from "./BlogFeaturedImage";
import {
  BLOG_ARTICLE_TEMPLATES,
  type BlogArticleTemplate,
} from "@/lib/blogTemplates";

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
  const [articleTemplate, setArticleTemplate] = useState<BlogArticleTemplate>(
    initialData?.articleTemplate || "classic",
  );
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

  const editorRef = useRef<BlogRichTextEditorHandle>(null);
  const mediaUploadRef = useRef<HTMLInputElement>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const galleryPreviews = useMemo(
    () =>
      galleryRows.map((row, index) => ({
        index,
        url: row.kind === "existing" ? row.url : row.preview,
        caption: row.caption,
        placement: row.placement,
        layout: row.layout,
      })),
    [galleryRows],
  );

  const handleLayoutChange = (index: number, layout: BlogImageLayout) => {
    setGalleryRows((prev) => {
      const partner = imageRowPartner(content, index);
      return prev.map((row, i) => {
        if (i === index || i === partner) return { ...row, layout };
        return row;
      });
    });
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setGalleryRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, caption } : row)),
    );
  };

  const handleSetCover = (index: number) => {
    setGalleryRows((prev) => setCoverOnRows(prev, index));
    toast.success(`Photo ${index + 1} is now the featured cover`);
  };

  const handleInsertInStory = (index: number) => {
    if (imageInStoryRow(content, index)) {
      toast.error("This image is already in a side-by-side row");
      return;
    }
    const ok = editorRef.current?.insertImage(index);
    editorRef.current?.focus();
    if (ok) toast.success(`Image ${index + 1} inserted into the story`);
    else toast.error("Could not insert — image may already be in the story or is the featured cover");
  };

  const handleInsertRow = (a: number, b: number) => {
    const ok = editorRef.current?.insertRow(a, b);
    editorRef.current?.focus();
    if (ok) toast.success("Side-by-side row inserted into story");
    else toast.error("This row is already in the story");
  };

  const handleSetGallery = (index: number) => {
    setGalleryRows((prev) =>
      prev.map((row, i) =>
        i === index ?
          ({ ...row, placement: "gallery" as const })
        : row,
      ),
    );
    toast.success(`Image ${index + 1} added to end gallery`);
  };
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
      formData.append("articleTemplate", articleTemplate);
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
      setContent(
        normalizeBlogStorageContent(injectImagesIntoContent(draft.content, slots)),
      );
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
    <form onSubmit={onSubmit} className="max-w-[1200px] mx-auto">
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
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-5 py-2.5 rounded-xl transition-all border border-gray-200 shadow-sm"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>
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

      <details className="rounded-2xl border border-violet-100 bg-violet-50/30 group">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-violet-900">AI Journal Writer</span>
          <ChevronDown className="w-4 h-4 text-violet-600 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="px-5 pb-5">
          <AdminAiBlogDraftSection onApply={applyAiDraft} prefill={prefill} compact />
        </div>
      </details>

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

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => setSeoOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-3.5 text-left hover:bg-emerald-50/70 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <Search className="w-4 h-4" />
              SEO &amp; Tags
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  seoScore.score >= 75 ?
                    "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
                }`}
              >
                {seoScore.score}/100
              </span>
              <ChevronDown className={`w-4 h-4 text-emerald-700 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {seoOpen && (
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-5 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm">
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
                  <label className="text-xs font-semibold text-gray-600">Keywords</label>
                  <input
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="banarasi saree, wedding styling"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Tags</label>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="bridal, saree, styling"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template + WordPress-style editor */}
      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
            Story Template
          </label>
          <p className="text-xs text-gray-500">
            Layout and typography on the live journal page
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {BLOG_ARTICLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  if (tpl.id === articleTemplate) return;
                  const hasContent = content.trim().length > 20;
                  if (
                    hasContent &&
                    !confirm(
                      `Switch to "${tpl.label}"? This will replace your current content with the template starter text.`,
                    )
                  ) {
                    return;
                  }
                  setArticleTemplate(tpl.id);
                  setContent(normalizeBlogStorageContent(tpl.starterContent));
                }}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  articleTemplate === tpl.id ?
                    "border-brand-500 bg-brand-50/50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80"
                }`}
              >
                <span className="block text-sm font-bold text-gray-900">{tpl.label}</span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                  {tpl.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm font-bold text-gray-700 uppercase tracking-wide">
            <span>Content <span className="text-brand-500">*</span></span>
            <span className="font-medium text-[11px] text-gray-400 normal-case">
              Click in text, then Add Media or a thumbnail to insert
            </span>
          </label>

          <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
            <BlogRichTextEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              gallery={galleryPreviews}
              onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
              placeholder="Write your journal story…"
            />

            <div className="lg:sticky lg:top-4 space-y-4">
              <BlogMediaSidebar
                rows={galleryRows}
                content={content}
                onSetCover={handleSetCover}
                onInsertInStory={handleInsertInStory}
                onInsertRow={handleInsertRow}
                onOpenMediaLibrary={() => setMediaLibraryOpen(true)}
                onUploadClick={() => mediaUploadRef.current?.click()}
                onLayoutChange={handleLayoutChange}
                onCaptionChange={handleCaptionChange}
                maxImages={10}
              />

              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={galleryRows.length >= 10}
                />
                <Plus className="w-4 h-4" />
                Browse &amp; crop
              </label>

              {pendingCropFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <p className="font-medium">{pendingCropFiles.length} waiting to crop</p>
                  <button
                    type="button"
                    onClick={clearPendingCropQueue}
                    className="mt-1 text-[10px] font-bold uppercase text-amber-900 hover:text-red-700"
                  >
                    Clear queue
                  </button>
                </div>
              )}

              <details className="rounded-xl border border-gray-200 bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                  Captions &amp; manage
                </summary>
                <div className="px-3 pb-3">
                  <BlogImageGalleryEditor
                    rows={galleryRows}
                    onRowsChange={setGalleryRows}
                    content={content}
                    onContentChange={setContent}
                    onRemoveExisting={isEditing ? handleRemoveExistingImage : undefined}
                    onInsertInStory={handleInsertInStory}
                    onSetCover={handleSetCover}
                    maxImages={10}
                  />
                </div>
              </details>
            </div>
          </div>
        </div>

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

    <input
      ref={mediaUploadRef}
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={handleQuickUpload}
    />

    <BlogPreviewModal
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      title={title}
      slug={slug}
      content={content}
      excerpt={excerpt}
      category={category}
      tags={previewTags}
      images={previewImages}
      articleTemplate={articleTemplate}
    />

    <BlogMediaLibraryModal
      open={mediaLibraryOpen}
      onClose={() => setMediaLibraryOpen(false)}
      items={galleryPreviews}
      content={content}
      onInsert={handleInsertInStory}
      onInsertRow={handleInsertRow}
      onSetCover={handleSetCover}
      onSetGallery={handleSetGallery}
      onUploadRequest={() => mediaUploadRef.current?.click()}
      maxImages={10}
    />
    </form>
  );
}
