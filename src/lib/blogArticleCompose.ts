import type { BlogImage } from "@/types";



export type ArticleBlock =

  | { type: "html"; html: string }

  | { type: "image"; image: BlogImage; imageIndex: number }

  | { type: "row"; images: BlogImage[]; indices: number[] };



const IMAGE_MARKER = /\[\[image:(\d+)\]\]/gi;



const MARKER_SPLIT =

  /(\[\[image:\d+\]\]|\[\[row:[\d,\s]+\]\])/gi;



function rowSignature(indices: number[]): string {

  return indices.join(",");

}



function collectUsedIndices(blocks: ArticleBlock[]): Set<number> {

  const used = new Set<number>();

  for (const block of blocks) {

    if (block.type === "image") used.add(block.imageIndex);

    if (block.type === "row") block.indices.forEach((i) => used.add(i));

  }

  return used;

}



function parseBlocksFromMarkers(

  content: string,

  images: BlogImage[],

): ArticleBlock[] {

  const parts = content.split(MARKER_SPLIT).filter((p) => p?.trim());

  const blocks: ArticleBlock[] = [];

  const usedIndices = new Set<number>();

  const seenRows = new Set<string>();



  for (const part of parts) {

    const imageMatch = part.match(/^\[\[image:(\d+)\]\]$/i);

    if (imageMatch) {

      const idx = Number(imageMatch[1]);

      if (usedIndices.has(idx)) continue;

      const img = images[idx];

      if (img && img.placement !== "cover") {

        blocks.push({ type: "image", image: img, imageIndex: idx });

        usedIndices.add(idx);

      }

      continue;

    }



    const rowMatch = part.match(/^\[\[row:([\d,\s]+)\]\]$/i);

    if (rowMatch) {

      const indices = rowMatch[1]

        .split(",")

        .map((s) => Number(s.trim()))

        .filter((n) => !Number.isNaN(n));

      const sig = rowSignature(indices);

      if (seenRows.has(sig)) continue;

      const rowImages = indices

        .map((i) => images[i])

        .filter((img): img is BlogImage => Boolean(img && img.placement !== "cover"));

      if (rowImages.length > 0) {

        blocks.push({ type: "row", images: rowImages, indices });

        seenRows.add(sig);

        indices.forEach((i) => usedIndices.add(i));

      }

      continue;

    }



    const html = part.trim();

    if (html) blocks.push({ type: "html", html });

  }



  return blocks;

}



function appendGalleryBlocks(

  blocks: ArticleBlock[],

  images: BlogImage[],

): ArticleBlock[] {

  const usedInContent = collectUsedIndices(blocks);

  const gallery = images

    .map((img, i) => ({ img, i }))

    .filter(({ img, i }) => img.placement === "gallery" && !usedInContent.has(i));



  if (gallery.length === 0) return blocks;



  const out = [...blocks];

  const seenRows = new Set<string>();

  let i = 0;

  while (i < gallery.length) {

    const current = gallery[i];

    const next = gallery[i + 1];

    if (

      current.img.layout === "split" &&

      next &&

      next.img.layout === "split"

    ) {

      const sig = rowSignature([current.i, next.i]);

      if (!seenRows.has(sig)) {

        out.push({

          type: "row",

          images: [current.img, next.img],

          indices: [current.i, next.i],

        });

        seenRows.add(sig);

      }

      i += 2;

    } else {

      out.push({

        type: "image",

        image: current.img,

        imageIndex: current.i,

      });

      i += 1;

    }

  }

  return out;

}



export function composeArticleBlocks(

  content: string,

  images: BlogImage[],

): ArticleBlock[] {

  const trimmed = String(content || "").trim();

  const hasMarkers = MARKER_SPLIT.test(trimmed);

  MARKER_SPLIT.lastIndex = 0;



  let blocks: ArticleBlock[] = [];



  if (hasMarkers) {

    blocks = parseBlocksFromMarkers(trimmed, images);

  } else if (trimmed) {

    blocks = [{ type: "html", html: trimmed }];

  }



  return appendGalleryBlocks(blocks, images);

}



export function getCoverImage(images: BlogImage[]): BlogImage | undefined {

  const cover = images.find((i) => i.placement === "cover");

  if (cover) return cover;

  const hero = images.find((i) => i.layout === "hero");

  if (hero) return hero;

  return images[0];

}



/** Optional AI helper — admin can remove markers manually. */

export function injectImagesIntoContent(content: string, imageSlots: number): string {

  if (imageSlots < 1 || IMAGE_MARKER.test(content)) return content;

  return `${content}\n[[image:1]]`;

}


