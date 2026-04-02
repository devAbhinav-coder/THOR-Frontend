import { Fragment, type ReactNode } from "react";

type RichTextContentProps = {
  text?: string | null;
  className?: string;
};

function isUnorderedBulletLine(line: string): boolean {
  return /^(\-|\*|•)\s+/.test(line);
}

function isOrderedBulletLine(line: string): boolean {
  return /^\d+[\.\)]\s+/.test(line);
}

function cleanUnorderedBullet(line: string): string {
  return line.replace(/^(\-|\*|•)\s+/, "").trim();
}

function cleanOrderedBullet(line: string): string {
  return line.replace(/^\d+[\.\)]\s+/, "").trim();
}

function headingLevel(line: string): number {
  const m = line.match(/^(#{1,6})\s+/);
  return m ? m[1].length : 0;
}

function cleanHeading(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRe = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRe.exec(text)) !== null) {
    const token = match[0];
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex, start)}</Fragment>);
    }

    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      nodes.push(<strong key={`t-${key++}`} className="font-semibold text-gray-900">{token.slice(2, -2)}</strong>);
    } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      nodes.push(<em key={`t-${key++}`} className="italic">{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`t-${key++}`} className="rounded bg-gray-100 px-1 py-0.5 text-[13px] text-gray-800">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<Fragment key={`t-${key++}`}>{token}</Fragment>);
    }
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

export default function RichTextContent({ text, className }: RichTextContentProps) {
  const raw = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return null;

  const lines = raw.split("\n");
  const blocks: Array<
    | { type: "h"; level: number; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
  > = [];
  let paragraphBuffer: string[] = [];
  let unorderedListBuffer: string[] = [];
  let orderedListBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      blocks.push({ type: "p", text: paragraphBuffer.join("\n").trim() });
      paragraphBuffer = [];
    }
  };
  const flushUnordered = () => {
    if (unorderedListBuffer.length) {
      blocks.push({ type: "ul", items: [...unorderedListBuffer] });
      unorderedListBuffer = [];
    }
  };
  const flushOrdered = () => {
    if (orderedListBuffer.length) {
      blocks.push({ type: "ol", items: [...orderedListBuffer] });
      orderedListBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      continue;
    }

    const hLevel = headingLevel(trimmed);
    if (hLevel > 0) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      blocks.push({ type: "h", level: hLevel, text: cleanHeading(trimmed) });
      continue;
    }

    if (isUnorderedBulletLine(trimmed)) {
      flushParagraph();
      flushOrdered();
      unorderedListBuffer.push(cleanUnorderedBullet(trimmed));
      continue;
    }

    if (isOrderedBulletLine(trimmed)) {
      flushParagraph();
      flushUnordered();
      orderedListBuffer.push(cleanOrderedBullet(trimmed));
      continue;
    }

    flushUnordered();
    flushOrdered();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushUnordered();
  flushOrdered();

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        if (block.type === "h") {
          const headingClass =
            block.level <= 2
              ? "text-gray-900 font-semibold text-lg leading-8"
              : "text-gray-900 font-semibold text-base leading-7";
          return (
            <h4 key={`h-${idx}`} className={headingClass}>
              {renderInline(block.text)}
            </h4>
          );
        }
        if (block.type === "p") {
          return (
          <p key={`p-${idx}`} className="text-gray-700 leading-8 text-[15px] whitespace-pre-wrap break-words">
            {renderInline(block.text)}
          </p>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={`ol-${idx}`} className="list-decimal pl-5 space-y-1.5 text-gray-700 leading-8 text-[15px]">
              {block.items.map((item, itemIdx) => (
                <li key={`${idx}-${itemIdx}`} className="break-words">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={`ul-${idx}`} className="list-disc pl-5 space-y-1.5 text-gray-700 leading-8 text-[15px]">
            {block.items.map((item, itemIdx: number) => (
              <li key={`${idx}-${itemIdx}`} className="break-words">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
