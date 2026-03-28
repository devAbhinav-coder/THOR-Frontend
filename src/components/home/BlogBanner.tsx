"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { storefrontApi } from "@/lib/api";
import { StorefrontSettings } from "@/types";

export default function BlogBanner() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    storefrontApi
      .getSettings()
      .then((res) => setSettings(res.data?.settings || null))
      .catch(() => {});
  }, []);

  const blog = settings?.blogBanner;

  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 sm:py-32 isolate">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[40rem] h-[40rem] bg-gold-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-navy-900/50 backdrop-blur-xl border border-navy-700/50 rounded-[2.5rem] p-8 sm:p-16 lg:p-20 overflow-hidden shadow-2xl relative">
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
            {/* Text Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-semibold tracking-wide uppercase mb-8">
                <BookOpen className="w-4 h-4" />
                {blog?.eyebrow || "Journal & Stories"}
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                {blog?.title?.split(' ').map((word, i, arr) => {
                   if (i >= arr.length - 2 && i > 0) {
                     return <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-brand-400"> {word}</span>;
                   }
                   return i === 0 ? word : ' ' + word;
                }) || (
                  <>Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-brand-400">Art of Ethnic</span></>
                )}
              </h2>
              
              <p className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed font-light">
                {blog?.description || "Dive deep into the rich history of Indian textures, get styling tips from experts, and stay updated with our latest collections and pop-up stalls."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={blog?.buttonLink || "/blog"}
                  className="group inline-flex items-center justify-center gap-3 bg-white text-navy-950 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:bg-gold-50 hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                  {blog?.buttonText || "Visit Our Blog"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Image Composition */}
            <div className="relative h-full min-h-[400px] lg:min-h-full flex items-center justify-center lg:justify-end">
              {/* Main Image */}
              <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent z-10" />
                <Image
                  src={blog?.mainImage || ""}
                  alt="Journal Highlight"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Decorative floating element */}
              <div className="absolute top-1/4 -left-12 sm:left-0 lg:-left-12 w-48 aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transform -rotate-12 border-4 border-navy-900 z-20 hidden sm:block bg-navy-950">
                <Image
                  src={blog?.sideImage || ""}
                  alt="Fabric details"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
