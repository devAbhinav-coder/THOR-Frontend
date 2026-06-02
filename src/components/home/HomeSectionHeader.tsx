import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  id?: string;
  className?: string;
  headingClassName?: string;
  align?: "center" | "left";
};

export default function HomeSectionHeader({
  eyebrow,
  title,
  subtitle,
  id,
  className,
  headingClassName,
  align = "center",
}: Props) {
  const centered = align === "center";

  return (
    <div className={cn(centered ? "text-center" : "text-left", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-3 text-brand-600",
          !centered && "flex",
        )}
      >
        <span className="h-px w-12 bg-brand-200 sm:w-16" aria-hidden="true" />
        <p className={homeSectionStyles.eyebrow}>{eyebrow}</p>
        <span className="h-px w-12 bg-brand-200 sm:w-16" aria-hidden="true" />
      </div>
      <h2
        id={id}
        className={cn(homeSectionStyles.title, "mt-3", headingClassName)}
      >
        {title}
      </h2>
      {subtitle ?
        <p
          className={cn(
            homeSectionStyles.subtitle,
            "mt-3",
            centered && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      : null}
    </div>
  );
}
