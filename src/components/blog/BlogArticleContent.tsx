"use client";

import { useEffect } from "react";
import Image from "next/image";
import { History } from "lucide-react";
import type { BlogImage, BlogImageLayout } from "@/types";
import { sanitizeBlogHtml } from "@/lib/sanitizeBlogHtml";
import { composeArticleBlocks } from "@/lib/blogArticleCompose";
import { getBlogTemplate } from "@/lib/blogTemplates";
import { BLOG_EDITOR_GOOGLE_FONTS_URL } from "@/lib/blogEditorFonts";

type Props = {
  content: string;
  images: BlogImage[];
  title: string;
  template?: string | null;
};

function imageSpacingClass(templateId: string): string {
  return templateId === "lookbook" ?
      "my-8 sm:my-10 md:my-14"
    : "my-8 sm:my-10 md:my-12";
}

function wideBreakoutClass(templateId: string, layout: BlogImageLayout): string {
  if (layout !== "hero" && layout !== "wide") return "";
  if (templateId === "magazine" || templateId === "lookbook") {
    // Negative margins match parent px-4/sm:px-6/md:px-8 — never extend past viewport
    return "w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] -mx-4 sm:-mx-6 md:w-[calc(100%+4rem)] md:-mx-8 max-w-none";
  }
  return "";
}

function LayoutImage({
  img,
  title,
  layout,
  templateId,
}: {
  img: BlogImage;
  title: string;
  layout: BlogImageLayout;
  templateId: string;
}) {
  const spacing = imageSpacingClass(templateId);
  const breakout = wideBreakoutClass(templateId, layout);

  if (layout === "split") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 ${spacing}`}>
        <div className="relative w-full min-h-[220px] sm:min-h-[280px] md:min-h-[360px] overflow-hidden rounded-sm">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="bg-account-primary p-6 sm:p-8 md:p-12 flex flex-col justify-center min-h-[200px] sm:min-h-[240px] rounded-sm">
          <History className="w-8 h-8 sm:w-10 sm:h-10 text-[#ffdea5] mb-4 sm:mb-6 shrink-0" strokeWidth={1.25} />
          {img.caption ?
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed italic">
              {img.caption}
            </p>
          : null}
        </div>
      </div>
    );
  }

  if (layout === "portrait") {
    return (
      <figure className={`${spacing} mx-auto w-full max-w-md px-0 group`}>
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-account-surface-container-low rounded-sm">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 90vw, 448px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em] px-2">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (layout === "square") {
    return (
      <figure className={`${spacing} mx-auto w-full max-w-2xl group`}>
        <div className="relative w-full aspect-square overflow-hidden bg-account-surface-container-low rounded-sm">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em] px-2">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (layout === "wide" || layout === "hero") {
    return (
      <figure className={`${spacing} group ${breakout}`}>
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-account-surface-container-low rounded-sm">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em] px-2">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className={`${spacing} group`}>
      <div className="overflow-hidden bg-account-surface-container-low rounded-sm">
        <div className="relative w-full h-[min(420px,65vw)] sm:h-[min(500px,70vw)]">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      </div>
      {img.caption && (
        <figcaption className="mt-3 sm:mt-4 text-[10px] sm:text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em] px-2">
          {img.caption}
        </figcaption>
      )}
    </figure>
  );
}

function rowAspectClass(layout: BlogImageLayout): string {
  switch (layout) {
    case "square":
    case "split":
      return "aspect-square";
    case "wide":
    case "hero":
      return "aspect-[16/9]";
    case "portrait":
      return "aspect-[4/5]";
    default:
      return "aspect-[4/5]";
  }
}

function RowImages({
  images,
  title,
  templateId,
}: {
  images: BlogImage[];
  title: string;
  templateId: string;
}) {
  const spacing = imageSpacingClass(templateId);

  if (images.length === 1) {
    const img = images[0];
    const layout =
      img.layout === "split" && !img.caption ? "inline" : (img.layout || "inline");
    return (
      <LayoutImage img={img} title={title} layout={layout} templateId={templateId} />
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${spacing}`}>
      {images.map((img, i) => (
        <figure key={img.publicId || `row-img-${i}`} className="group min-w-0">
          <div
            className={`relative overflow-hidden bg-account-surface-container-low rounded-sm ${rowAspectClass(img.layout || "portrait")}`}
          >
            <Image
              src={img.url}
              alt={img.caption || title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {img.caption && (
            <figcaption className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em] px-1">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export default function BlogArticleContent({ content, images, title, template }: Props) {
  const blocks = composeArticleBlocks(content, images);
  const tpl = getBlogTemplate(template);

  useEffect(() => {
    const id = "blog-article-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = BLOG_EDITOR_GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  if (blocks.length === 0) return null;

  let galleryStarted = false;
  let isFirstHtmlBlock = true;

  return (
    <article
      className={`journal-article-root space-y-2 sm:space-y-4 text-account-primary journal-template-${tpl.id} overflow-x-clip max-w-full w-full min-w-0`}
    >
      {blocks.map((block, idx) => {
        if (block.type === "html") {
          const leadClass = isFirstHtmlBlock ? "journal-article-lead" : "";
          isFirstHtmlBlock = false;
          return (
            <div
              key={`html-${idx}`}
              className={`journal-article-body ${leadClass}`}
              dangerouslySetInnerHTML={{
                __html: sanitizeBlogHtml(block.html),
              }}
            />
          );
        }

        const isGalleryImage =
          block.type === "image" ?
            block.image.placement === "gallery"
          : block.images.some((img) => img.placement === "gallery");

        const showGalleryHeader = isGalleryImage && !galleryStarted && tpl.id === "lookbook";
        if (showGalleryHeader) galleryStarted = true;

        const galleryHeader = showGalleryHeader ? (
          <div
            key={`gallery-h-${idx}`}
            className="journal-gallery-header pt-6 sm:pt-8 mt-4 border-t border-account-outline-variant/30"
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-account-on-surface-variant/60 text-center mb-2">
              The Gallery
            </p>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-center text-account-primary px-2">
              Visual Edit
            </h2>
          </div>
        ) : null;

        if (block.type === "row") {
          return (
            <div key={`row-${idx}-${block.indices.join("-")}`} className="min-w-0">
              {galleryHeader}
              <RowImages images={block.images} title={title} templateId={tpl.id} />
            </div>
          );
        }
        const soloLayout = block.image.layout || "inline";
        return (
          <div
            key={`img-${block.image.publicId}-${block.imageIndex}-${soloLayout}`}
            className="min-w-0"
          >
            {galleryHeader}
            <LayoutImage
              img={block.image}
              title={title}
              layout={soloLayout}
              templateId={tpl.id}
            />
          </div>
        );
      })}
    </article>
  );
}
