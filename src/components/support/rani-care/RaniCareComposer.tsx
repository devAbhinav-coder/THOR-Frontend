"use client";

import { useCallback, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "./useAutoResizeTextarea";

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
      <div
        className={cn(
          "relative flex rounded-2xl border border-gray-300 bg-gray-50/80",
          "focus-within:bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/30",
          "transition-colors",
          disabled && "opacity-60",
        )}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type a message'
          rows={1}
          maxLength={500}
          enterKeyHint='send'
          autoComplete='off'
          autoCorrect='on'
          spellCheck
          aria-label='Message support'
          disabled={disabled}
          data-lenis-prevent
          className={cn(
            "rani-composer-input w-full min-h-[44px] max-h-24 resize-none bg-transparent",
            "py-2.5 pl-3.5 pr-[3.25rem] text-sm text-gray-800 leading-snug",
            "placeholder:text-gray-400",
            "border-0 focus:outline-none focus:ring-0",
            "overflow-y-auto scrollbar-hide",
            "disabled:cursor-not-allowed",
          )}
        />
        <button
          type='submit'
          disabled={!canSend}
          className={cn(
            "absolute right-1.5 bottom-1.5",
            "h-9 w-9 shrink-0 rounded-xl text-white",
            "inline-flex items-center justify-center",
            "bg-brand-600 hover:bg-brand-700 active:scale-95",
            "disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100",
            "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
          )}
          aria-label='Send message'
        >
          <Send className='h-[17px] w-[17px] shrink-0' strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </form>
  );
}
