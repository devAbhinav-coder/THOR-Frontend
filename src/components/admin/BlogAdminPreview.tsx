"use client";



import { useState } from "react";

import Image from "next/image";

import { Monitor, Smartphone } from "lucide-react";

import type { BlogImage, BlogImageLayout } from "@/types";

import { categoryLabel, formatReadingTime } from "@/lib/blogHelpers";

import BlogArticleContent from "@/components/blog/BlogArticleContent";

import { getCoverImage } from "@/lib/blogArticleCompose";



type PreviewMode = "desktop" | "mobile";



type Props = {

  title: string;

  slug: string;

  content: string;

  excerpt: string;

  category: string;

  tags: string[];

  images: BlogImage[];

  readingTimeMin?: number;

};



export default function BlogAdminPreview({

  title,

  content,

  excerpt,

  category,

  tags,

  images,

  readingTimeMin = 5,

}: Props) {

  const [mode, setMode] = useState<PreviewMode>("desktop");

  const hero = getCoverImage(images);



  const previewBody = (

    <>

      {hero?.url && (

        <div

          className={`relative w-full bg-account-surface-container ${

            mode === "mobile" ? "h-40" : "h-56"

          }`}

        >

          <Image

            src={hero.url}

            alt={title || "Cover"}

            fill

            className="object-cover"

            unoptimized

          />

          <div className="absolute inset-0 bg-gradient-to-t from-account-primary/70 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4">

            <p className="text-[10px] text-[#ffdea5] uppercase tracking-widest mb-1">

              {categoryLabel(category)}

            </p>

            <h3

              className={`font-serif text-white leading-tight line-clamp-2 ${

                mode === "mobile" ? "text-base" : "text-lg"

              }`}

            >

              {title || "Untitled Story"}

            </h3>

          </div>

        </div>

      )}



      <div className={`space-y-4 ${mode === "mobile" ? "p-3" : "p-4"}`}>

        {!hero?.url && (

          <div>

            <p className="text-[10px] text-account-secondary uppercase tracking-widest">

              {categoryLabel(category)}

            </p>

            <h3 className="font-serif text-xl text-account-primary mt-1">

              {title || "Untitled Story"}

            </h3>

          </div>

        )}



        <p className="text-xs text-account-on-surface-variant/70 uppercase">

          {formatReadingTime(readingTimeMin)}

        </p>



        {excerpt && (

          <p className="text-sm text-account-on-surface-variant italic leading-relaxed">

            {excerpt}

          </p>

        )}



        {content ?

          <div

            className={`pointer-events-none ${

              mode === "mobile" ? "text-[13px]" : "scale-[0.92] origin-top-left w-[108%]"

            }`}

          >

            <BlogArticleContent content={content} images={images} title={title} />

          </div>

        : <p className="text-sm text-gray-400 italic">Write content to see preview…</p>}



        {tags.length > 0 && (

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">

            {tags.map((t) => (

              <span

                key={t}

                className="text-[9px] uppercase bg-account-surface-container-high px-2 py-0.5"

              >

                {t}

              </span>

            ))}

          </div>

        )}



        {images.length > 0 && mode === "desktop" && (

          <div className="pt-3 border-t border-gray-100">

            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">

              All images ({images.length})

            </p>

            <div className="grid grid-cols-3 gap-2">

              {images.map((img, i) => (

                <div key={img.publicId || img.url} className="relative aspect-square rounded overflow-hidden">

                  <Image src={img.url} alt="" fill className="object-cover" unoptimized />

                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white text-center py-0.5">

                    #{i} · {(img.layout as BlogImageLayout) || "inline"}

                  </span>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

    </>

  );



  return (

    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-[#fcfbf7] shadow-lg">

      <div className="px-4 py-3 bg-account-primary text-white flex items-center justify-between gap-3">

        <div>

          <span className="text-xs font-bold uppercase tracking-widest block">Live Preview</span>

          <span className="text-[10px] text-white/55">

            {mode === "desktop" ? "Desktop article page" : "Mobile article page"}

          </span>

        </div>

        <div className="flex rounded-lg overflow-hidden border border-white/20 shrink-0">

          <button

            type="button"

            onClick={() => setMode("desktop")}

            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${

              mode === "desktop" ?

                "bg-white text-account-primary"

              : "bg-white/10 text-white/80 hover:bg-white/20"

            }`}

            title="Desktop preview"

          >

            <Monitor className="w-3.5 h-3.5" />

            Desktop

          </button>

          <button

            type="button"

            onClick={() => setMode("mobile")}

            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${

              mode === "mobile" ?

                "bg-white text-account-primary"

              : "bg-white/10 text-white/80 hover:bg-white/20"

            }`}

            title="Mobile preview"

          >

            <Smartphone className="w-3.5 h-3.5" />

            Mobile

          </button>

        </div>

      </div>



      {mode === "mobile" ?

        <div className="p-4 bg-gray-100 flex justify-center">

          <div className="w-full max-w-[390px] rounded-[2rem] border-[6px] border-gray-800 bg-[#fcfbf7] shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">

            <div className="h-6 bg-gray-800 flex items-center justify-center">

              <div className="w-16 h-1 rounded-full bg-gray-600" />

            </div>

            {previewBody}

          </div>

        </div>

      : <div className="max-h-[min(78vh,820px)] overflow-y-auto">{previewBody}</div>}

    </div>

  );

}


