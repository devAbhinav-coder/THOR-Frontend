"use client";

import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Authentic Craft",
    description: "Silk Mark Certified & GI Tagged Weaves",
  },
  {
    icon: Truck,
    title: "Pan-India Care",
    description: "Complimentary Insured Shipping Across India",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Seamless 7-Day Boutique Exchange Policy",
  },
] as const;

export default function WhyChooseUs() {
  return (
    <section
      className="border-y border-gray-100 bg-gray-50/80 py-10 sm:py-12"
      aria-label="Why shop with us"
    >
      <div className={homeSectionStyles.container}>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center sm:px-4"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center text-[#c5a059]">
                <Icon className="h-7 w-7 stroke-[1.25]" aria-hidden />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-900 sm:text-xs">
                {title}
              </h3>
              <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-gray-500 sm:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
