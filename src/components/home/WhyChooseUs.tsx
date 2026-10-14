"use client";

import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Artisan Heritage",
    description: "Timeless Indian Craftsmanship",
  },
  {
    icon: Truck,
    title: "Pan-India Shipping",
    description: "Complimentary Insured Shipping",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "5-Day Return Policy",
  },
] as const;

export default function WhyChooseUs() {
  return (
    <section
      className='border-y border-gray-100 bg-gray-50/80 py-0.5 sm:py-2'
      aria-label='Why shop with us'
    >
      <div className={homeSectionStyles.container}>
        <div className='grid grid-cols-3 gap-2 sm:gap-6'>
          {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='flex min-w-0 flex-col items-center text-center px-0.5 sm:px-4'
            >
              <div className='mb-2 flex h-9 w-9 items-center justify-center text-[#c5a059] sm:mb-3 sm:h-11 sm:w-11'>
                <Icon
                  className='h-5 w-5 stroke-[1.25] sm:h-7 sm:w-7'
                  aria-hidden
                />
              </div>
              <h3 className='text-[9px] font-semibold uppercase leading-tight tracking-[0.08em] text-navy-900 sm:text-xs sm:tracking-[0.2em]'>
                {title}
              </h3>
              <p className='mt-1 hidden max-w-[220px] text-xs leading-relaxed text-gray-500 sm:block sm:text-sm'>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
