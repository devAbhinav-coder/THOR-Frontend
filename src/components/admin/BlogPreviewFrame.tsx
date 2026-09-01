"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { BlogImage } from "@/types";
import { categoryLabel, formatReadingTime } from "@/lib/blogHelpers";
import BlogArticleContent from "@/components/blog/BlogArticleContent";
import { getCoverImage } from "@/lib/blogArticleCompose";
import { BLOG_EDITOR_GOOGLE_FONTS_URL } from "@/lib/blogEditorFonts";
import { templateContentWidth } from "@/lib/blogTemplates";

type Props = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  images: BlogImage[];
  readingTimeMin?: number;
  articleTemplate?: string;
  compact?: boolean;
};

export default function BlogPreviewFrame({
  title,
  content,
  excerpt,
  category,
  tags,
  images,
  readingTimeMin = 5,
  articleTemplate = "classic",
  compact = false,
}: Props) {
  const hero = getCoverImage(images);

  useEffect(() => {
    const id = "blog-preview-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = BLOG_EDITOR_GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  return (
    <div className="bg-[#fcfbf7] min-h-0 blog-preview-frame">
      {hero?.url && (
        <div
          className={`relative w-full bg-account-surface-container overflow-hidden ${
            compact ?
              "min-h-[200px] h-[40vh] max-h-[320px]"
            : "min-h-[280px] h-[45vh] sm:h-[55vh] md:h-[65vh] max-h-[720px]"
          }`}
        >
          <Image
            src={hero.url}
            alt={title || "Cover"}
            fill
            className="object-cover"
            unoptimized
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-8 bg-gradient-to-t from-account-primary/60 to-transparent">
            <p className="text-[10px] sm:text-xs text-[#ffdea5] uppercase tracking-widest mb-2 sm:mb-4">
              {categoryLabel(category)}
            </p>
            <h3
              className={`font-serif text-white leading-tight max-w-4xl ${
                compact ? "text-xl" : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold"
              }`}
            >
              {title || "Untitled Story"}
            </h3>
          </div>
        </div>
      )}

      <div className={`space-y-5 ${compact ? "p-4" : "p-6 md:p-10"}`}>
        {!hero?.url && (
          <div>
            <p className="text-[10px] text-account-secondary uppercase tracking-widest">
              {categoryLabel(category)}
            </p>
            <h3 className="font-serif text-2xl md:text-3xl text-account-primary mt-1">
              {title || "Untitled Story"}
            </h3>
          </div>
        )}

        <p className="text-xs text-account-on-surface-variant/70 uppercase tracking-wider">
          {formatReadingTime(readingTimeMin)}
        </p>

        {excerpt && (
          <p className="journal-article-excerpt text-account-on-surface-variant italic border-l-2 border-brand-400 pl-4">
            {excerpt}
          </p>
        )}

        {content ?
          <div className={`${templateContentWidth(articleTemplate)} mx-auto w-full min-w-0 px-1`}>
            <BlogArticleContent
              key={content.slice(0, 120) + images.map((i) => i.layout).join(",")}
              content={content}
              images={images}
              title={title}
              template={articleTemplate}
            />
          </div>
        : <p className="text-sm text-gray-400 italic py-8 text-center">
            Write content in the editor to see your story here…
          </p>
        }

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase bg-account-surface-container-high px-2.5 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
