"use client";

import { useCallback, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "./useAutoResizeTextarea";
import { raniComposerWrap, raniSendBtn } from "./raniCareHeritageTheme";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => Promise<boolean>;
  disabled: boolean;
  focusOnMount?: boolean;
};

export function RaniCareComposer({
  input,
  setInput,
  onSend,
  disabled,
  focusOnMount = false,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resize = useAutoResizeTextarea(inputRef, input);
  const canSend = Boolean(input.trim()) && !disabled;

  useEffect(() => {
    if (!focusOnMount) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(t);
  }, [focusOnMount]);

  const sendMessage = useCallback(async () => {
    if (!canSend) return;
    const text = input;
    const sent = await onSend(text);
    if (sent) {
      resize();
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }, [canSend, input, onSend, resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    e.stopPropagation();
    void sendMessage();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void sendMessage();
      }}
    >
      <div className={cn(raniComposerWrap, disabled && "opacity-60")}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message"
          rows={1}
          maxLength={500}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          spellCheck
          aria-label="Message support"
          disabled={disabled}
          data-lenis-prevent
          className={cn(
            "rani-composer-input w-full min-h-[44px] max-h-24 resize-none bg-transparent",
            "border-0 py-2.5 pl-3.5 pr-[3.25rem] text-sm leading-snug text-navy-900",
            "placeholder:text-gray-400 focus:outline-none focus:ring-0",
            "overflow-y-auto scrollbar-hide disabled:cursor-not-allowed",
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            raniSendBtn,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/40 focus-visible:ring-offset-1",
          )}
          aria-label="Send message"
        >
          <Send className="h-[17px] w-[17px] shrink-0" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </form>
  );
}
