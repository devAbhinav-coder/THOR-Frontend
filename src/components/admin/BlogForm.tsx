"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X, Plus, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import { Blog } from "@/types";
import CropModal from "./CropModal";

interface BlogFormProps {
  initialData?: Blog;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);

  // Existing images (for edit mode)
  const [existingImages, setExistingImages] = useState(initialData?.images || []);

  // New selected files and their active captions
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [newCaptions, setNewCaptions] = useState<string[]>([]);

  // Cropping State
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const limitExceededCount = existingImages.length + selectedFiles.length + filesArray.length > 10;
      if (limitExceededCount) {
        toast.error("You can upload a maximum of 10 images.");
        return;
      }
      setPendingCropFiles(filesArray);
      e.target.value = ''; // Reset input so same files can be selected again if needed
    }
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
    
    setSelectedFiles((prev) => [...prev, newFile]);
    setNewCaptions((prev) => [...prev, ""]);
    setFilePreviews((prev) => [...prev, URL.createObjectURL(croppedBlob)]);

    // Move to next file or clear
    setPendingCropFiles((prev) => prev.slice(1));
  };

  const handleCropCancel = () => {
    // Skip the current image, move to next
    setPendingCropFiles((prev) => prev.slice(1));
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[indexToRemove]); // Free memory
      return prev.filter((_, i) => i !== indexToRemove);
    });
    setNewCaptions((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleRemoveExistingImage = async (publicId: string) => {
    if (!initialData) return;
    if (confirm("Are you sure you want to permanently delete this image from the server?")) {
      try {
         await blogApi.deleteImage(initialData._id, publicId);
         setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
         toast.success("Image deleted");
      } catch {
         toast.error("Failed to delete image");
      }
    }
  };

  const updateExistingCaption = (index: number, newCaption: string) => {
    const updated = [...existingImages];
    updated[index].caption = newCaption;
    setExistingImages(updated);
  };

  const updateNewCaption = (index: number, caption: string) => {
    const updated = [...newCaptions];
    updated[index] = caption;
    setNewCaptions(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("content", content);
      formData.append("isPublished", isPublished.toString());

      if (isEditing) {
        // Send updated existing images to preserve caption changes
        formData.append("existingImages", JSON.stringify(existingImages));
        if (selectedFiles.length > 0) {
           selectedFiles.forEach((file) => formData.append("images", file));
           formData.append("newCaptions", JSON.stringify(newCaptions));
        }
        return blogApi.update(initialData._id, formData);
      } else {
        if (selectedFiles.length > 0) {
           selectedFiles.forEach((file) => formData.append("images", file));
           formData.append("captions", JSON.stringify(newCaptions));
        }
        return blogApi.create(formData);
      }
    },
    onSuccess: () => {
      toast.success(`Blog ${isEditing ? "updated" : "created"} successfully!`);
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
    if (!title || !slug || !content) {
      toast.error("Please fill in all required fields (Title, Slug, Content)");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-5xl mx-auto space-y-8 bg-white/70 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-8 gap-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-gray-900 drop-shadow-sm">
            {isEditing ? "Edit Journal Entry" : "Create New Journal"}
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Craft a beautiful story complete with vibrant imagery.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-2.5 text-sm text-gray-700 font-semibold bg-white shadow-sm px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input 
               type="checkbox" 
               className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 transition-colors"
               checked={isPublished}
               onChange={(e) => setIsPublished(e.target.checked)}
            />
            {isPublished ? "Published" : "Draft Status"}
          </label>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Entry
          </button>
        </div>
      </div>

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

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
            <span>Content Body <span className="text-brand-500">*</span></span>
            <span className="font-medium text-[11px] text-gray-400 normal-case">HTML elements supported</span>
          </label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Once upon a time in the workshops of artisans..."
            className="w-full h-80 px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 text-lg leading-relaxed focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:outline-none transition-all resize-y placeholder:text-gray-300 shadow-inner"
          />
        </div>
      </div>

      {/* Media Uploads */}
      <div className="space-y-6 pt-10 border-t border-gray-100 mt-6">
        <div>
          <div className="mb-6">
             <h3 className="text-xl font-bold font-serif text-gray-900 mb-2">Immersive Gallery</h3>
             <p className="text-sm text-gray-500 font-medium">Add up to 10 captivating images to accompany the story. You will be prompted to crop each new selection.</p>
          </div>
          
          <div className="flex gap-4 mb-8">
             <label className="group relative overflow-hidden inline-flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 px-8 py-10 rounded-3xl cursor-pointer transition-all w-full flex-1">
               <input
                 type="file"
                 multiple
                 accept="image/*"
                 className="hidden"
                 onChange={handleFileSelect}
                 disabled={existingImages.length + selectedFiles.length >= 10}
               />
               <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                 <Plus className="w-8 h-8 text-brand-500" />
               </div>
               <span className="font-bold text-lg">Click to browse or drag & drop</span>
               <span className="text-xs font-semibold uppercase tracking-wider opacity-60">High-res JPEG / PNG</span>
             </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Display existing images in edit mode */}
            {existingImages.map((img, idx) => (
              <div key={img.publicId} className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                  <img src={img.url} alt="Existing" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(img.publicId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                    Cloud
                  </span>
                </div>
                <input
                   type="text"
                   value={img.caption || ""}
                   onChange={(e) => updateExistingCaption(idx, e.target.value)}
                   placeholder="Add a beautiful caption..."
                   className="w-full px-4 py-2.5 text-sm font-medium bg-gray-50 focus:bg-white border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400"
                />
              </div>
            ))}

            {/* Display newly selected files */}
            {filePreviews.map((preview, idx) => (
              <div key={preview} className="flex flex-col gap-3 p-4 bg-brand-50/50 rounded-2xl shadow-sm border border-brand-100 hover:shadow-md transition-shadow relative group animate-in fade-in slide-in-from-bottom-4">
                <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-brand-200 bg-white flex items-center justify-center">
                  <img src={preview} alt="New Selection" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    className="absolute top-3 right-3 p-2 bg-white/90 text-gray-500 hover:bg-gray-900 hover:text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                    New Add
                  </span>
                </div>
                <input
                   type="text"
                   value={newCaptions[idx]}
                   onChange={(e) => updateNewCaption(idx, e.target.value)}
                   placeholder="Add a beautiful caption..."
                   className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {pendingCropFiles.length > 0 && (
        <CropModal
          imageSrc={URL.createObjectURL(pendingCropFiles[0])}
          originalFile={pendingCropFiles[0]}
          onCropComplete={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </form>
  );
}
