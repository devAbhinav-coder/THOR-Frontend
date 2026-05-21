import { cn } from "@/lib/utils";
import { parseBoldSegments } from "./formatChat";

export function ChatMessageBody({
  text,
  variant = "bot",
}: {
  text: string;
  variant?: "bot" | "user";
}) {
  const segments = parseBoldSegments(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ?
          <strong
            key={i}
            className={cn(
              "font-semibold",
              variant === "user" ? "text-white" : "text-gray-900",
            )}
          >
            {seg.text}
          </strong>
        : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}
