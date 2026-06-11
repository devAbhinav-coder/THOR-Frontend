const MARKER_SPLIT = /(\[\[image:\d+\]\]|\[\[row:[\d,\s]+\]\])/gi;

export type StorySegment =
  | { kind: "text"; html: string }
  | { kind: "image"; index: number }
  | { kind: "row"; indices: number[] };

/** Flat line model for planner UI + precise insert. */
export type PlannerLine =
  | { type: "text"; html: string; heading: string | null }
  | { type: "image"; index: number }
  | { type: "row"; indices: number[] };

export function parseStorySegments(content: string): StorySegment[] {
  const trimmed = String(content || "").trim();
  if (!trimmed) return [];

  const parts = trimmed.split(MARKER_SPLIT).filter((p) => p?.trim());
  const segments: StorySegment[] = [];

  for (const part of parts) {
    const imageMatch = part.match(/^\[\[image:(\d+)\]\]$/i);
    if (imageMatch) {
      segments.push({ kind: "image", index: Number(imageMatch[1]) });
      continue;
    }

    const rowMatch = part.match(/^\[\[row:([\d,\s]+)\]\]$/i);
    if (rowMatch) {
      const indices = rowMatch[1]
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
      if (indices.length > 0) {
        segments.push({ kind: "row", indices });
      }
      continue;
    }

    segments.push({ kind: "text", html: part.trim() });
  }

  return segments;
}

export function segmentsToContent(segments: StorySegment[]): string {
  if (segments.length === 0) return "";
  return segments
    .map((s) => {
      if (s.kind === "text") return s.html;
      if (s.kind === "image") return `[[image:${s.index}]]`;
      return `[[row:${s.indices.join(",")}]]`;
    })
    .join("\n\n");
}

/** Split HTML blob into heading-led sections for the planner. */
export function splitHtmlByHeadings(html: string): Array<{ heading: string | null; html: string }> {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/(?=<h[1-6][\s>])/i).filter((p) => p.trim());
  if (parts.length === 0) return [{ heading: null, html: trimmed }];

  return parts.map((part) => {
    const headingMatch = part.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i);
    if (headingMatch) {
      return {
        heading: headingMatch[2].replace(/<[^>]+>/g, "").trim() || null,
        html: part.trim(),
      };
    }
    return { heading: null, html: part.trim() };
  });
}

/** First block element (p, blockquote, etc.) vs remainder — for intro / prose sections. */
export function splitAfterFirstBodyBlock(html: string): { lead: string; tail: string } {
  const trimmed = html.trim();
  if (!trimmed) return { lead: "", tail: "" };

  const blockRe =
    /^(<(?:p|blockquote|ul|ol|div|figure|h[1-6])[^>]*>[\s\S]*?<\/(?:p|blockquote|ul|ol|div|figure|h[1-6])>)\s*/i;
  const m = trimmed.match(blockRe);
  if (!m) return { lead: "", tail: trimmed };

  const lead = m[1].trim();
  const tail = trimmed.slice(m[0].length).trim();
  return { lead, tail };
}

export function segmentsToPlannerLines(segments: StorySegment[]): PlannerLine[] {
  const lines: PlannerLine[] = [];

  for (const seg of segments) {
    if (seg.kind === "image") {
      lines.push({ type: "image", index: seg.index });
      continue;
    }
    if (seg.kind === "row") {
      lines.push({ type: "row", indices: [...seg.indices] });
      continue;
    }
    const sections = splitHtmlByHeadings(seg.html);
    if (sections.length === 0) {
      lines.push({ type: "text", html: seg.html, heading: null });
    } else {
      for (const sec of sections) {
        lines.push({ type: "text", html: sec.html, heading: sec.heading });
      }
    }
  }

  return lines;
}

export function plannerLinesToSegments(lines: PlannerLine[]): StorySegment[] {
  const segments: StorySegment[] = [];
  let textBuf: string[] = [];

  const flushText = () => {
    if (textBuf.length > 0) {
      segments.push({ kind: "text", html: textBuf.join("\n") });
      textBuf = [];
    }
  };

  for (const line of lines) {
    if (line.type === "text") {
      textBuf.push(line.html);
    } else {
      flushText();
      if (line.type === "image") {
        segments.push({ kind: "image", index: line.index });
      } else {
        segments.push({ kind: "row", indices: [...line.indices] });
      }
    }
  }
  flushText();
  return segments;
}

export function contentToPlannerLines(content: string): PlannerLine[] {
  return segmentsToPlannerLines(parseStorySegments(content));
}

export function plannerLinesToContent(lines: PlannerLine[]): string {
  return segmentsToContent(plannerLinesToSegments(lines));
}

export function textPreview(html: string, max = 100): string {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max)}…`;
}

export function indicesUsedInStory(content: string): Set<number> {
  const used = new Set<number>();
  for (const line of contentToPlannerLines(content)) {
    if (line.type === "image") used.add(line.index);
    if (line.type === "row") line.indices.forEach((i) => used.add(i));
  }
  return used;
}

export function clearImageFromLines(lines: PlannerLine[], imageIndex: number): PlannerLine[] {
  const out: PlannerLine[] = [];

  for (const line of lines) {
    if (line.type === "image") {
      if (line.index !== imageIndex) out.push(line);
      continue;
    }
    if (line.type === "row") {
      const remaining = line.indices.filter((i) => i !== imageIndex);
      if (remaining.length >= 2) {
        out.push({ type: "row", indices: remaining });
      } else if (remaining.length === 1) {
        out.push({ type: "image", index: remaining[0] });
      }
      continue;
    }
    out.push(line);
  }

  return out;
}

export function clearImageFromContent(content: string, imageIndex: number): string {
  const lines = clearImageFromLines(contentToPlannerLines(content), imageIndex);
  return plannerLinesToContent(lines);
}

export function extractHeadingBody(html: string): {
  heading: string | null;
  headingHtml: string;
  bodyHtml: string;
} {
  const trimmed = html.trim();
  const m = trimmed.match(/^(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)\s*([\s\S]*)$/i);
  if (m) {
    return {
      heading: m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
      headingHtml: m[1].trim(),
      bodyHtml: m[2].trim(),
    };
  }
  return { heading: null, headingHtml: "", bodyHtml: trimmed };
}

/** Body-only fragment after a below-heading split — not its own planner section. */
export function isPrimarySectionTextLine(
  line: PlannerLine,
  lineIndex: number,
  lines: PlannerLine[],
): boolean {
  if (line.type !== "text") return false;

  const firstTextIdx = lines.findIndex((l) => l.type === "text");
  if (lineIndex === firstTextIdx) return true;

  const { headingHtml } = extractHeadingBody(line.html);
  return Boolean(headingHtml);
}

function findPrimaryTextLineIndex(lines: PlannerLine[], sectionIndex: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isPrimarySectionTextLine(lines[i], i, lines)) {
      idx++;
      if (idx === sectionIndex) return i;
    }
  }
  return -1;
}

function findSectionRange(
  lines: PlannerLine[],
  sectionIndex: number,
): { start: number; end: number } | null {
  const start = findPrimaryTextLineIndex(lines, sectionIndex);
  if (start < 0) return null;

  for (let i = start + 1; i < lines.length; i++) {
    if (isPrimarySectionTextLine(lines[i], i, lines)) {
      return { start, end: i };
    }
  }
  return { start, end: lines.length };
}

/** One slot per section: image goes below heading, before paragraph body. */
export function insertImageBelowHeading(
  content: string,
  imageIndex: number,
  sectionIndex: number,
): string {
  let lines = clearImageFromLines(contentToPlannerLines(content), imageIndex);
  const range = findSectionRange(lines, sectionIndex);
  const imageLine: PlannerLine = { type: "image", index: imageIndex };

  if (!range) {
    return plannerLinesToContent([...lines, imageLine]);
  }

  const { start, end } = range;
  const textLine = lines[start];
  if (textLine.type !== "text") {
    return plannerLinesToContent(lines);
  }

  const { headingHtml, bodyHtml, heading } = extractHeadingBody(textLine.html);

  const bodyFragments: PlannerLine[] = [];
  for (let i = start + 1; i < end; i++) {
    if (lines[i].type === "text" && !isPrimarySectionTextLine(lines[i], i, lines)) {
      bodyFragments.push(lines[i]);
    }
  }

  const inlineBodyHtml =
    bodyHtml ||
    bodyFragments
      .map((l) => (l.type === "text" ? l.html : ""))
      .filter(Boolean)
      .join("\n");

  const before = lines.slice(0, start);
  const after = lines.slice(end);
  const middle: PlannerLine[] = [];

  if (headingHtml) {
    middle.push({ type: "text", html: headingHtml, heading });
    middle.push(imageLine);
    if (inlineBodyHtml) {
      middle.push({ type: "text", html: inlineBodyHtml, heading: null });
    }
  } else {
    const { lead, tail } = splitAfterFirstBodyBlock(textLine.html);
    const mergedLead = lead || textLine.html;
    const mergedTail =
      tail ||
      bodyFragments
        .map((l) => (l.type === "text" ? l.html : ""))
        .filter(Boolean)
        .join("\n");

    if (lead && (tail || mergedTail)) {
      middle.push({ type: "text", html: mergedLead, heading: null });
      middle.push(imageLine);
      if (mergedTail) {
        middle.push({ type: "text", html: mergedTail, heading: null });
      }
    } else {
      middle.push({ type: "text", html: mergedLead, heading: null });
      middle.push(imageLine);
    }
  }

  return plannerLinesToContent([...before, ...middle, ...after]);
}

/** Photo before entire section (above heading). */
export function insertImageAboveSection(
  content: string,
  imageIndex: number,
  sectionIndex: number,
): string {
  let lines = clearImageFromLines(contentToPlannerLines(content), imageIndex);
  const range = findSectionRange(lines, sectionIndex);
  const imageLine: PlannerLine = { type: "image", index: imageIndex };
  if (!range) return plannerLinesToContent([imageLine, ...lines]);
  return plannerLinesToContent([
    ...lines.slice(0, range.start),
    imageLine,
    ...lines.slice(range.start),
  ]);
}

/** Photo after entire section (below paragraph). */
export function insertImageBelowSection(
  content: string,
  imageIndex: number,
  sectionIndex: number,
): string {
  let lines = clearImageFromLines(contentToPlannerLines(content), imageIndex);
  const range = findSectionRange(lines, sectionIndex);
  const imageLine: PlannerLine = { type: "image", index: imageIndex };
  if (!range) return plannerLinesToContent([...lines, imageLine]);
  return plannerLinesToContent([
    ...lines.slice(0, range.end),
    imageLine,
    ...lines.slice(range.end),
  ]);
}

/** Side-by-side row after section. */
export function insertRowBelowSection(
  content: string,
  indices: [number, number],
  sectionIndex: number,
): string {
  let lines = contentToPlannerLines(content);
  for (const idx of indices) {
    lines = clearImageFromLines(lines, idx);
  }
  const range = findSectionRange(lines, sectionIndex);
  const rowLine: PlannerLine = { type: "row", indices: [...indices] };
  if (!range) return plannerLinesToContent([...lines, rowLine]);
  return plannerLinesToContent([
    ...lines.slice(0, range.end),
    rowLine,
    ...lines.slice(range.end),
  ]);
}

export function removePlannerLine(content: string, lineIndex: number): string {
  const lines = contentToPlannerLines(content);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  return plannerLinesToContent(lines.filter((_, i) => i !== lineIndex));
}

export function textSectionCount(content: string): number {
  const lines = contentToPlannerLines(content);
  return lines.filter((l, i) => isPrimarySectionTextLine(l, i, lines)).length;
}

export function rowSignature(indices: number[]): string {
  return indices.slice().sort((a, b) => a - b).join(",");
}

export function contentHasRowPair(content: string, a: number, b: number): boolean {
  const sig = rowSignature([a, b]);
  return contentToPlannerLines(content).some(
    (l) => l.type === "row" && rowSignature(l.indices) === sig,
  );
}

/** Partner index when image sits in a [[row:a,b]] marker. */
export function imageRowPartner(content: string, imageIndex: number): number | null {
  for (const line of contentToPlannerLines(content)) {
    if (line.type === "row" && line.indices.includes(imageIndex)) {
      const partner = line.indices.find((i) => i !== imageIndex);
      return partner ?? null;
    }
  }
  return null;
}

export function imageInStoryRow(content: string, imageIndex: number): boolean {
  return imageRowPartner(content, imageIndex) !== null;
}

/** Merge a lone [[image:a]] into [[row:a,b]] for split side-by-side pairs. */
export function addPartnerToImageLine(
  content: string,
  imageIndex: number,
  partnerIndex: number,
): string {
  if (imageIndex === partnerIndex) return content;

  let lines = clearImageFromLines(contentToPlannerLines(content), partnerIndex);

  const rowIdx = lines.findIndex(
    (l) => l.type === "row" && l.indices.includes(imageIndex),
  );
  if (rowIdx >= 0) {
    const row = lines[rowIdx];
    if (row.type === "row") {
      if (row.indices.includes(partnerIndex)) return plannerLinesToContent(lines);
      lines[rowIdx] = { type: "row", indices: [...row.indices, partnerIndex] };
      return plannerLinesToContent(lines);
    }
  }

  const lineIdx = lines.findIndex((l) => l.type === "image" && l.index === imageIndex);
  if (lineIdx < 0) return plannerLinesToContent(lines);

  lines[lineIdx] = { type: "row", indices: [imageIndex, partnerIndex] };
  return plannerLinesToContent(lines);
}

export type PlacedItemView = {
  lineIndex: number;
  line: PlannerLine;
};

export type StorySectionView = {
  sectionIndex: number;
  heading: string | null;
  bodyPreview: string;
  beforeItems: PlacedItemView[];
  headingSlotItems: PlacedItemView[];
  afterItems: PlacedItemView[];
};

export function buildStorySectionViews(content: string): StorySectionView[] {
  const lines = contentToPlannerLines(content);
  const views: StorySectionView[] = [];

  const primaryStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isPrimarySectionTextLine(lines[i], i, lines)) {
      primaryStarts.push(i);
    }
  }

  if (primaryStarts.length === 0) {
    if (lines.some((l) => l.type !== "text")) {
      views.push({
        sectionIndex: 0,
        heading: "Introduction",
        bodyPreview: "",
        beforeItems: lines.map((line, lineIndex) => ({ lineIndex, line })),
        headingSlotItems: [],
        afterItems: [],
      });
    }
    return views;
  }

  for (let s = 0; s < primaryStarts.length; s++) {
    const start = primaryStarts[s];
    const end = s + 1 < primaryStarts.length ? primaryStarts[s + 1] : lines.length;
    const textLine = lines[start];
    if (textLine.type !== "text") continue;

    const beforeItems: PlacedItemView[] = [];
    let lastTextBeforeStart = -1;
    for (let i = start - 1; i >= 0; i--) {
      if (lines[i].type === "text") {
        lastTextBeforeStart = i;
        break;
      }
    }
    for (let i = lastTextBeforeStart + 1; i < start; i++) {
      if (lines[i].type !== "text") {
        beforeItems.push({ lineIndex: i, line: lines[i] });
      }
    }

    const { heading, bodyHtml, headingHtml } = extractHeadingBody(textLine.html);
    const headingSlotItems: PlacedItemView[] = [];
    const afterItems: PlacedItemView[] = [];

    let bodyParts: string[] = [];
    if (bodyHtml) bodyParts.push(bodyHtml);

    let cursor = start + 1;
    while (cursor < end) {
      const row = lines[cursor];
      if (row.type === "image" && headingSlotItems.length === 0) {
        const prevIsSectionStart = cursor === start + 1;
        const next = lines[cursor + 1];
        const nextIsBodyFragment =
          next?.type === "text" && !isPrimarySectionTextLine(next, cursor + 1, lines);

        if (headingHtml) {
          if (nextIsBodyFragment || !bodyHtml) {
            headingSlotItems.push({ lineIndex: cursor, line: row });
            cursor++;
            continue;
          }
        } else if (prevIsSectionStart && nextIsBodyFragment) {
          headingSlotItems.push({ lineIndex: cursor, line: row });
          cursor++;
          continue;
        }
      }

      if (row.type === "text" && !isPrimarySectionTextLine(row, cursor, lines)) {
        bodyParts.push(row.html);
        cursor++;
        continue;
      }

      if (row.type !== "text") {
        afterItems.push({ lineIndex: cursor, line: row });
      }
      cursor++;
    }

    const bodyPreview =
      bodyParts.length > 0 ? textPreview(bodyParts.join(" "), 160)
      : !headingHtml ? textPreview(textLine.html, 160)
      : "";

    const displayHeading =
      heading || (headingHtml ? null : s === 0 ? "Introduction" : null);

    views.push({
      sectionIndex: s,
      heading: displayHeading,
      bodyPreview,
      beforeItems,
      headingSlotItems,
      afterItems,
    });
  }

  return views;
}
