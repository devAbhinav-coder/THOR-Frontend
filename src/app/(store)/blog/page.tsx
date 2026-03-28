"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, ChevronRight, Eye, Sparkles } from "lucide-react";
import { blogApi } from "@/lib/api";
import { Blog, ApiResponse } from "@/types";

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchBlogs = async (pageParam: number) => {
    try {
      setIsLoading(true);
      const res: ApiResponse<{ blogs: Blog[] }> = await blogApi.getAll({ page: pageParam, limit: 6 });
      
      if (res.data?.blogs) {
        if (pageParam === 1) {
          setBlogs(res.data.blogs);
        } else {
          setBlogs((prev) => [...prev, ...res.data!.blogs]);
        }
        setHasMore(res.pagination?.hasNextPage || false);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(1);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchBlogs(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading]);

  return (
    <div className="relative min-h-screen bg-navy-950 overflow-hidden pt-5 pb-10 selection:bg-brand-500/30">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[50rem] h-[50rem] bg-brand-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[50rem] h-[50rem] bg-gold-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold tracking-widest uppercase mb-8 shadow-[0_0_20px_-5px_rgba(232,96,76,0.3)]">
             <Sparkles className="w-4 h-4" />
             The House of Rani Journal
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">
            Inside the <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-brand-400">Atelier</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 leading-relaxed font-light max-w-2xl mx-auto">
            Explore tales of timeless craftsmanship, modern styling tips, behind-the-scenes insights, and the latest from our pop-up events.
          </p>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
          {blogs.map((blog, idx) => (
            <Link 
              href={`/blog/${blog.slug}`} 
              key={blog._id}
              className="group flex flex-col bg-navy-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden md:hover:border-gold-500/30 transition-all duration-500 md:hover:-translate-y-1.5 md:hover:shadow-[0_20px_50px_-12px_rgba(234,179,8,0.15)] relative transform-gpu isolate"
            >
              {/* Highlight Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/0 via-gold-500/0 to-white/0 md:group-hover:from-brand-600/5 md:group-hover:via-gold-500/5 md:group-hover:to-white/5 transition-colors duration-500 z-0 pointer-events-none" />

              <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy-900/40 z-10 transform-gpu">
                {blog.images && blog.images[0] ? (
                  <Image
                    src={blog.images[0].url}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-700 md:group-hover:scale-[1.03] transform-gpu will-change-transform"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10 uppercase tracking-widest text-sm font-bold bg-navy-900">
                    The House of Rani
                  </div>
                )}
                
                {/* Overlay gradient - extended down and made solid at bottom to kill subpixel gap */}
                <div className="absolute inset-x-0 -bottom-2 h-[60%] bg-gradient-to-t from-[#0e172a] via-[#0e172a]/60 to-transparent opacity-90 transition-opacity duration-500 md:group-hover:opacity-100 pointer-events-none z-20" />
                
                {/* Stats overlays */}
                <div className="absolute bottom-5 left-5 flex gap-3 text-xs font-bold text-white z-30">
                  <div className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20 shadow-2xl transition-colors">
                    <Heart className="w-4 h-4 text-brand-400 fill-brand-400" />
                    <span className="text-white drop-shadow-md">{blog.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20 shadow-2xl transition-colors">
                    <Eye className="w-4 h-4 text-blue-300" />
                    <span className="text-white drop-shadow-md">{blog.viewCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 p-6 sm:p-8 relative z-10 bg-[#0e172a]/20">
                {/* Structural seal to cover fractional rendering cracks (flexbox zoom sub-pixel issue) */}
                <div className="absolute -top-1 inset-x-0 h-2 bg-[#0e172a] -z-10" />
                
                <div className="flex items-center gap-2 text-xs text-brand-300 font-bold tracking-widest uppercase mb-4 opacity-80 md:group-hover:opacity-100 transition-opacity">
                  <span>{new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-white/20">•</span>
                  <span>{blog.author?.name || "Editorial"}</span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-snug md:group-hover:text-gold-300 transition-colors">
                  {blog.title}
                </h2>
                
                <p className="text-base text-white/50 line-clamp-3 mb-8 flex-1 font-light leading-relaxed">
                  {blog.content.replace(/<[^>]*>?/gm, '')}
                </p>
                
                <div className="flex items-center w-full justify-between mt-auto pt-5 border-t border-white/5">
                   <span className="text-sm font-bold tracking-wide text-brand-400 flex items-center gap-2 md:group-hover:text-gold-400 transition-colors">
                    Read the Story 
                    <ChevronRight className="w-4 h-4 md:group-hover:translate-x-1 transition-transform" />
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Loading / Infinite Scroll Sentinel */}
        <div ref={observerTarget} className="py-20 flex justify-center items-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-5">
               <div className="relative flex items-center justify-center">
                 <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                 <div className="absolute w-4 h-4 bg-brand-500 rounded-full animate-pulse blur-[1px]" />
               </div>
               <span className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase">Unveiling stories...</span>
            </div>
          ) : !hasMore && blogs.length > 0 ? (
            <div className="text-center">
              <span className="inline-block px-6 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-xs text-white/40 font-bold tracking-widest uppercase">
                End of the Line
              </span>
            </div>
          ) : !isLoading && blogs.length === 0 ? (
             <div className="text-center w-full py-24 bg-navy-900/20 rounded-3xl border border-white/5 border-dashed">
               <p className="text-white/40 text-lg font-light">The journal is currently empty. Awaken soon for new tales.</p>
             </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
