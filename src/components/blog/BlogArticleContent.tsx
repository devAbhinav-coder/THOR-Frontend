"use client";

import Image from "next/image";
import { History } from "lucide-react";
import type { BlogImage, BlogImageLayout } from "@/types";
import { sanitizeBlogHtml } from "@/lib/sanitizeBlogHtml";
import { composeArticleBlocks } from "@/lib/blogArticleCompose";

type Props = {
  content: string;
  images: BlogImage[];
  title: string;
};

function LayoutImage({
  img,
  title,
  layout,
}: {
  img: BlogImage;
  title: string;
  layout: BlogImageLayout;
}) {
  if (layout === "split") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
        <div className="relative w-full min-h-[280px] md:min-h-[360px] overflow-hidden">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="bg-account-primary p-10 md:p-12 flex flex-col justify-center min-h-[240px]">
          <History className="w-10 h-10 text-[#ffdea5] mb-6 shrink-0" strokeWidth={1.25} />
          {img.caption ?
            <p className="font-serif text-xl md:text-2xl text-white/90 leading-relaxed italic">
              {img.caption}
            </p>
          : null}
        </div>
      </div>
    );
  }

  if (layout === "portrait") {
    return (
      <figure className="my-12 mx-auto w-full max-w-md group">
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-account-surface-container-low">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 90vw, 448px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-4 text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em]">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (layout === "square") {
    return (
      <figure className="my-12 mx-auto w-full max-w-2xl group">
        <div className="relative w-full aspect-square overflow-hidden bg-account-surface-container-low">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-4 text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em]">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (layout === "wide" || layout === "hero") {
    return (
      <figure className="my-12 group">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-account-surface-container-low">
          <Image
            src={img.url}
            alt={img.caption || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-4 text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em]">
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="my-12 group">
      <div className="overflow-hidden bg-account-surface-container-low">
        <div className="relative w-full h-[min(500px,70vw)]">
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
        <figcaption className="mt-4 text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em]">
          {img.caption}
        </figcaption>
      )}
    </figure>
  );
}

function RowImages({
  images,
  title,
}: {
  images: BlogImage[];
  title: string;
}) {
  if (images.length === 1) {
    const img = images[0];
    const layout =
      img.layout === "split" && !img.caption ? "inline" : (img.layout || "inline");
    return <LayoutImage img={img} title={title} layout={layout} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
      {images.map((img, i) => (
        <figure key={img.publicId || `row-img-${i}`} className="group">
          <div className="relative aspect-[4/5] overflow-hidden bg-account-surface-container-low">
            <Image
              src={img.url}
              alt={img.caption || title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {img.caption && (
            <figcaption className="mt-3 text-xs font-semibold text-account-on-surface-variant/70 italic text-center uppercase tracking-[0.15em]">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export default function BlogArticleContent({ content, images, title }: Props) {
  const blocks = composeArticleBlocks(content, images);

  if (blocks.length === 0) return null;

  return (
    <article className="space-y-6 text-account-primary">
      {blocks.map((block, idx) => {
        if (block.type === "html") {
          return (
            <div
              key={`html-${idx}`}
              className="journal-article-body"
              dangerouslySetInnerHTML={{
                __html: sanitizeBlogHtml(block.html),
              }}
            />
          );
        }
        if (block.type === "row") {
          return (
            <RowImages
              key={`row-${idx}-${block.indices.join("-")}`}
              images={block.images}
              title={title}
            />
          );
        }
        const soloLayout = block.image.layout || "inline";
        return (
          <LayoutImage
            key={`img-${block.image.publicId}-${block.imageIndex}`}
            img={block.image}
            title={title}
            layout={soloLayout === "split" ? "wide" : soloLayout}
          />
        );
      })}
    </article>
  );
}
