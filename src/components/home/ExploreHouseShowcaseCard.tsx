"use client";

import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { cn } from "@/lib/utils";

export const EXPLORE_HOUSE_CARD_CLASS =
  "group relative block aspect-[3/4] w-[clamp(104px,28vw,150px)] shrink-0 snap-start md:w-[160px] lg:w-[180px] xl:w-[200px] 2xl:w-[215px]";

export type ExploreHouseCard = {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image: string;
  comingSoon?: boolean;
};

type ExploreHouseShowcaseCardProps = {
  card: ExploreHouseCard;
  priority?: boolean;
  className?: string;
  disableLoader?: boolean;
};

export default function ExploreHouseShowcaseCard({
  card,
  priority,
  className,
  disableLoader,
}: ExploreHouseShowcaseCardProps) {
  const content = (
    <>
      <Image
        src={card.image}
        alt={card.name}
        fill
        loader={disableLoader ? undefined : cloudinaryLoader}
        unoptimized={disableLoader}
        sizes="(max-width: 640px) 30vw, (max-width: 1024px) 160px, 215px"
        className={cn(
          "card-hover-zoom object-cover transition-transform duration-500 ease-out",
          !card.comingSoon && "group-hover:scale-105",
        )}
        priority={priority}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {card.comingSoon && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/20" />
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-end px-2 pb-3 text-center text-white sm:px-2.5 sm:pb-3.5 lg:pb-4 xl:pb-5">
        <h3 className="line-clamp-2 font-serif text-xs font-medium leading-tight tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] sm:text-sm lg:text-base xl:text-lg">
          {card.name}
        </h3>
        {card.subtitle ? (
          <p
            className={cn(
              "mt-1 max-w-full px-0.5 text-[7px] font-semibold uppercase leading-[1.35] tracking-[0.08em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] sm:text-[8px] sm:tracking-[0.12em] lg:text-[9px] lg:tracking-[0.16em] xl:text-[10px]",
              card.comingSoon ? "text-[#d4b87a]" : "text-[#ececec]",
            )}
          >
            {card.subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  if (card.comingSoon) {
    return (
      <div
        className={cn(EXPLORE_HOUSE_CARD_CLASS, "overflow-hidden", className)}
        aria-label={`${card.name} — Coming soon`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={card.href}
      className={cn(EXPLORE_HOUSE_CARD_CLASS, "overflow-hidden", className)}
    >
      {content}
    </Link>
  );
}
