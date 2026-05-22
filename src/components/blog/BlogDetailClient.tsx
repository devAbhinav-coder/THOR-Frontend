"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  Send,
  Trash2,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import { getSiteUrl } from "@/lib/siteUrl";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { useAuthStore } from "@/store/useAuthStore";
import { Blog, BlogComment } from "@/types";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import type { BlogDetailServerResult } from "@/lib/blogServer";
import { plainBlogExcerpt } from "@/lib/blogServer";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Props = {
  slug: string;
  initialData?: BlogDetailServerResult | null;
};

export default function BlogDetailClient({ slug, initialData }: Props) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [commentText, setCommentText] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const res = await blogApi.getBySlug(slug);
      return (res.data ?? null) as { blog: Blog; comments: BlogComment[] } | null;
    },
    enabled: !!slug,
    initialData: initialData ?? undefined,
    staleTime: 60_000,
  });

  const likeMutation = useMutation({
    mutationFn: (blogId: string) => blogApi.like(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", slug] });
    },
    onError: () => {
      if (!isAuthenticated) {
        toast.error("Please login to like this post");
        router.push("/auth/login");
      } else {
        toast.error("Failed to action");
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ blogId, content }: { blogId: string; content: string }) =>
      blogApi.addComment(blogId, content),
    onSuccess: () => {
      toast.success("Comment added!");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["blog", slug] });
    },
    onError: () => {
      toast.error("Failed to add comment. Please try again.");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ blogId, commentId }: { blogId: string; commentId: string }) =>
      blogApi.deleteComment(blogId, commentId),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["blog", slug] });
    },
  });

  const blog = data?.blog;
  const comments = data?.comments || [];
  const safeContentHtml = escapeHtml(blog?.content || "").replace(/\n/g, "<br />");
  const isLikedByMe =
    isAuthenticated && user ? blog?.likes?.includes(user._id) : false;

  const blogPostingLd = useMemo(() => {
    const appUrl = getSiteUrl();
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog?.title || "The House of Rani Journal",
      description: plainBlogExcerpt(blog?.content || "", 180),
      image: (blog?.images || []).map((img) => img.url).filter(Boolean),
      datePublished: blog?.createdAt,
      dateModified: blog?.updatedAt || blog?.createdAt,
      author: {
        "@type": "Person",
        name: blog?.author?.name || "The House of Rani",
      },
      publisher: {
        "@type": "Organization",
        name: "The House of Rani",
        logo: {
          "@type": "ImageObject",
          url: `${appUrl}/logoNew.png`,
        },
      },
      mainEntityOfPage: `${appUrl}/blog/${encodeURIComponent(slug)}`,
    };
  }, [blog, slug]);

  const breadcrumbLd = useMemo(() => {
    const appUrl = getSiteUrl();
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${appUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Journal",
          item: `${appUrl}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: blog?.title || "Journal Story",
          item: `${appUrl}/blog/${encodeURIComponent(slug)}`,
        },
      ],
    };
  }, [blog?.title, slug]);

  if (isLoading && !initialData) {
    return (
      <div className='min-h-screen bg-navy-950 pt-5 pb-16'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='space-y-6'>
            <Skeleton className='h-11 w-full rounded-xl bg-white/10' />
            <div className='relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-navy-900/40 border border-white/5'>
              <Skeleton className='absolute inset-0 bg-white/10' />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className='h-4 w-full rounded bg-white/10' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className='min-h-screen bg-navy-950 flex flex-col items-center justify-center pt-5 text-white'>
        <h1 className='text-4xl font-extrabold mb-4 text-white'>Story Not Found</h1>
        <p className='text-white/50 mb-8 max-w-md text-center'>
          We could not locate the journal entry you are looking for.
        </p>
        <Link
          href='/blog'
          className='px-8 py-3 bg-white text-navy-950 rounded-full font-bold hover:bg-gold-50 transition-colors shadow-xl'
        >
          Return to Journal
        </Link>
      </div>
    );
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Please login to like this story");
      router.push("/auth/login");
      return;
    }
    likeMutation.mutate(blog._id);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      router.push("/auth/login");
      return;
    }
    commentMutation.mutate({ blogId: blog._id, content: commentText.trim() });
  };

  return (
    <div className='bg-navy-950 min-h-screen overflow-x-clip pt-5 pb-2 selection:bg-brand-500/30'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className='fixed inset-0 pointer-events-none z-0'>
        <div className='absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-600/5 rounded-full blur-[120px]' />
        <div className='absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-gold-600/5 rounded-full blur-[120px]' />
      </div>

      <div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10'>
        <div className='mb-4'>
          <Link
            href='/blog'
            className='group inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors font-bold text-xs tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10'
          >
            <ChevronLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />{" "}
            Journal
          </Link>
        </div>

        <header className='mb-6 text-center'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-xs text-brand-300 font-bold tracking-widest uppercase mb-8'>
            <span className='flex items-center gap-1.5'>
              <Calendar className='w-4 h-4' />{" "}
              {new Date(blog.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className='text-white/20'>•</span>
            <span className='flex items-center gap-1.5'>
              <UserIcon className='w-4 h-4' /> {blog.author?.name || "The House of Rani"}
            </span>
          </div>

          <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-8 drop-shadow-xl break-words'>
            {blog.title}
          </h1>

          <div className='flex items-center justify-center gap-6 p-2 border-y border-white/5 bg-navy-900/20 backdrop-blur-sm rounded-3xl max-w-lg mx-auto'>
            <button
              type='button'
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className='group flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors disabled:opacity-50'
            >
              <div
                className={`p-3 rounded-full transition-all duration-300 ${isLikedByMe ? "bg-brand-500/20" : "bg-white/5 group-hover:bg-brand-500/10"}`}
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${isLikedByMe ? "fill-brand-400 text-brand-400" : "group-hover:text-brand-400"}`}
                />
              </div>
              <span className='font-bold text-base'>{blog.likes?.length || 0}</span>
            </button>
            <div className='w-px h-12 bg-white/10' />
            <a
              href='#comments'
              className='group flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors'
            >
              <div className='p-3 rounded-full bg-white/5 group-hover:bg-gold-500/10 transition-colors'>
                <MessageCircle className='w-6 h-6 group-hover:text-gold-400 transition-colors' />
              </div>
              <span className='font-bold text-base'>{comments?.length || 0}</span>
            </a>
          </div>
        </header>

        {blog.images && blog.images.length > 0 && (
          <div className='mb-12 group relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f1c] max-w-5xl mx-auto flex justify-center'>
            <img
              src={blog.images[0].url}
              alt={blog.images[0].caption || blog.title}
              className='w-full h-auto max-h-[75vh] object-contain'
            />
            {blog.images[0].caption && (
              <div className='absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20'>
                <p className='text-white/80 text-sm font-medium italic text-center'>
                  {blog.images[0].caption}
                </p>
              </div>
            )}
          </div>
        )}

        <article className='prose prose-invert md:prose-lg max-w-none mb-16 font-light leading-relaxed text-white/80'>
          <div dangerouslySetInnerHTML={{ __html: safeContentHtml }} />
        </article>

        {blog.images && blog.images.length > 1 && (
          <div className='space-y-12 mb-20 max-w-5xl mx-auto'>
            {blog.images.slice(1).map((img, idx) => (
              <figure key={img.publicId} className='flex flex-col items-center'>
                <img
                  src={img.url}
                  alt={img.caption || `Gallery image ${idx + 2}`}
                  className='w-full h-auto max-h-[85vh] object-contain rounded-[2rem] border border-white/5'
                  loading='lazy'
                />
                {img.caption && (
                  <figcaption className='mt-5 text-center text-white/50 text-sm italic max-w-3xl'>
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <section id='comments' className='pt-12 pb-8 border-t border-white/10'>
          <h2 className='text-3xl font-bold text-white flex items-center gap-3 mb-8'>
            <MessageCircle className='w-8 h-8 text-brand-400' />
            Responses
            <span className='text-xl text-white/30 font-normal'>
              ({comments?.length || 0})
            </span>
          </h2>

          {isAuthenticated ?
            <form onSubmit={handleAddComment} className='mb-12'>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder='Contribute your thoughts to the journal...'
                className='w-full bg-navy-900/90 border border-white/10 rounded-2xl p-4 text-white min-h-[100px]'
              />
              <div className='flex justify-end mt-4'>
                <button
                  type='submit'
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className='inline-flex items-center gap-2 rounded-full bg-white text-navy-950 font-bold px-6 py-2.5 text-sm disabled:opacity-50'
                >
                  {commentMutation.isPending ? "Posting..." : "Post Response"}
                  <Send className='w-3.5 h-3.5' />
                </button>
              </div>
            </form>
          : <div className='bg-navy-900/40 border border-white/5 rounded-3xl p-8 text-center mb-12'>
              <Link
                href={loginUrlWithRedirect(`/blog/${slug}`)}
                className='inline-flex bg-white text-navy-950 px-6 py-2.5 rounded-full text-sm font-bold'
              >
                Log In to Respond
              </Link>
            </div>
          }

          <div className='space-y-4'>
            {comments.length > 0 ?
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className='bg-white/5 border border-white/5 rounded-2xl p-5 sm:p-6'
                >
                  <div className='flex justify-between gap-4 mb-3'>
                    <span className='font-bold text-white'>
                      {comment.user?.name || "Anonymous"}
                    </span>
                    {(user?.role === "admin" || user?._id === comment.user?._id) && (
                      <button
                        type='button'
                        onClick={() => {
                          if (confirm("Remove this comment permanently?")) {
                            deleteCommentMutation.mutate({
                              blogId: blog._id,
                              commentId: comment._id,
                            });
                          }
                        }}
                        className='text-white/30 hover:text-rose-500 text-xs font-bold uppercase flex items-center gap-1'
                      >
                        <Trash2 className='w-3.5 h-3.5' /> Delete
                      </button>
                    )}
                  </div>
                  <p className='text-white/70 whitespace-pre-wrap text-sm sm:text-base'>
                    {comment.content}
                  </p>
                </div>
              ))
            : <p className='text-white/40 text-center py-12'>
                Be the first to share your thoughts on this story.
              </p>
            }
          </div>
        </section>
      </div>
    </div>
  );
}
