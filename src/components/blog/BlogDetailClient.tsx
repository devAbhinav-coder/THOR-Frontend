"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  ChevronLeft,
  Send,
  Trash2,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import { getSiteUrl } from "@/lib/siteUrl";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { useAuthStore } from "@/store/useAuthStore";
import { Blog, BlogComment, BlogRelatedProduct } from "@/types";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import type { BlogDetailServerResult } from "@/lib/blogServer";
import {
  categoryLabel,
  formatReadingTime,
} from "@/lib/blogHelpers";
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts";
import BlogProductLinks from "@/components/blog/BlogProductLinks";
import BlogArticleContent from "@/components/blog/BlogArticleContent";
import BlogNewsletter from "@/components/blog/BlogNewsletter";
import { getCoverImage } from "@/lib/blogArticleCompose";

type Props = {
  slug: string;
  initialData?: BlogDetailServerResult | null;
};

function relatedProductsFromBlog(blog: Blog): BlogRelatedProduct[] {
  const raw = blog.relatedProductIds || [];
  return raw.filter(
    (p): p is BlogRelatedProduct =>
      typeof p === "object" && p !== null && "slug" in p && Boolean(p.slug),
  );
}

export default function BlogDetailClient({ slug, initialData }: Props) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [commentText, setCommentText] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const res = await blogApi.getBySlug(slug);
      return (res.data ?? null) as {
        blog: Blog;
        comments: BlogComment[];
      } | null;
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
        router.push(
          loginUrlWithRedirect(
            window.location.pathname + window.location.search,
          ),
        );
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
    mutationFn: ({
      blogId,
      commentId,
    }: {
      blogId: string;
      commentId: string;
    }) => blogApi.deleteComment(blogId, commentId),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["blog", slug] });
    },
  });

  const blog = data?.blog;
  const comments = data?.comments || [];
  const isLikedByMe =
    isAuthenticated && user ? blog?.likes?.includes(user._id) : false;
  const relatedProducts = blog ? relatedProductsFromBlog(blog) : [];

  const heroImage = blog ? getCoverImage(blog.images || []) : undefined;

  const breadcrumbLd = useMemo(() => {
    const appUrl = getSiteUrl();
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${appUrl}/` },
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
      <div className='min-h-screen bg-[#fcfbf7] pt-5 pb-16'>
        <div className='max-w-3xl mx-auto px-4'>
          <Skeleton className='h-[60vh] w-full bg-account-surface-container mb-8' />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className='h-4 w-full rounded bg-account-surface-container mb-3'
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className='min-h-screen bg-[#fcfbf7] flex flex-col items-center justify-center pt-5 text-account-primary'>
        <h1 className='font-serif text-4xl font-bold mb-4'>Story Not Found</h1>
        <p className='text-account-on-surface-variant mb-8 max-w-md text-center'>
          We could not locate the journal entry you are looking for.
        </p>
        <Link
          href='/blog'
          className='px-8 py-3 bg-account-primary text-white text-xs font-semibold uppercase tracking-widest hover:bg-account-secondary transition-colors'
        >
          Return to Journal
        </Link>
      </div>
    );
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Please login to like this story");
      router.push(
        loginUrlWithRedirect(window.location.pathname + window.location.search),
      );
      return;
    }
    likeMutation.mutate(blog._id);
  };

  const handleShare = async () => {
    const url = `${getSiteUrl()}/blog/${blog.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      router.push(
        loginUrlWithRedirect(window.location.pathname + window.location.search),
      );
      return;
    }
    commentMutation.mutate({ blogId: blog._id, content: commentText.trim() });
  };

  return (
    <div className='bg-[#fcfbf7] min-h-screen overflow-x-hidden antialiased'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className='px-account-margin-mobile md:px-account-margin-desktop pt-4 max-w-account-container mx-auto'>
        <Link
          href='/blog'
          className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-account-on-surface-variant hover:text-account-primary transition-colors'
        >
          <ChevronLeft className='w-4 h-4' />
          The Journal
        </Link>
      </div>

      <header className='relative w-full h-[870px] max-h-[85vh] overflow-hidden mt-4'>
        {heroImage?.url ?
          <Image
            src={heroImage.url}
            alt={heroImage.caption || blog.title}
            fill
            priority
            className='object-cover'
            sizes='100vw'
          />
        : <div className='absolute inset-0 bg-account-primary' />}
        <div className='absolute inset-0 bg-black/20' />
        <div className='absolute bottom-0 left-0 w-full p-account-margin-mobile md:p-account-margin-desktop bg-gradient-to-t from-account-primary/60 to-transparent'>
          <div className='max-w-account-container mx-auto journal-animate-reveal'>
            <p className='text-xs font-semibold text-[#ffdea5] uppercase tracking-widest mb-4'>
              {categoryLabel(blog.category)}
            </p>
            <h1 className='font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl leading-tight'>
              {blog.title}
            </h1>
          </div>
        </div>
      </header>

      <main className='relative pt-account-stack-lg pb-account-stack-lg'>
        <div className='max-w-3xl mx-auto px-account-margin-mobile md:px-0'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-account-outline-variant/30 pb-account-stack-md mb-account-stack-lg'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full overflow-hidden bg-account-surface-container relative shrink-0'>
                {blog.author?.avatar ?
                  <Image
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    fill
                    className='object-cover'
                  />
                : <div className='w-full h-full flex items-center justify-center text-account-on-surface-variant text-xs font-bold'>
                    {blog.author?.name?.[0] || "R"}
                  </div>
                }
              </div>
              <div>
                <p className='text-xs font-semibold text-account-primary uppercase'>
                  {blog.author?.name || "The House of Rani"}
                </p>
                <p className='text-sm text-account-on-surface-variant/60'>
                  Editorial
                </p>
              </div>
            </div>
            <div className='text-left sm:text-right'>
              <p className='text-xs text-account-on-surface-variant/60 uppercase'>
                {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className='text-xs text-account-on-surface-variant/60 uppercase'>
                {formatReadingTime(blog.readingTimeMin)}
              </p>
            </div>
          </div>

          <BlogArticleContent
            content={blog.content}
            images={blog.images || []}
            title={blog.title}
          />

          <BlogProductLinks products={relatedProducts} blogSlug={slug} />

          <div className='mt-account-stack-lg pt-account-stack-md border-t border-account-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-6'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-xs font-semibold text-account-on-surface-variant uppercase'>
                Tags:
              </span>
              {(blog.tags || []).slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className='px-3 py-1 bg-account-surface-container-high text-xs font-semibold uppercase'
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className='flex items-center gap-6'>
              <button
                type='button'
                onClick={() => void handleShare()}
                className='flex items-center gap-2 text-xs font-semibold uppercase text-account-primary hover:text-account-secondary transition-colors'
              >
                <Share2 className='w-4 h-4' /> Share
              </button>
              <button
                type='button'
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className='flex items-center gap-2 text-xs font-semibold uppercase text-account-primary hover:text-account-secondary transition-colors disabled:opacity-50'
              >
                <Heart
                  className={`w-4 h-4 ${isLikedByMe ? "fill-account-secondary text-account-secondary" : ""}`}
                />
                {blog.likes?.length || 0}
              </button>
            </div>
          </div>
        </div>

        <BlogRelatedPosts slug={slug} />

        <section
          id='comments'
          className='max-w-3xl mx-auto px-account-margin-mobile md:px-0 mt-account-stack-lg pt-account-stack-lg border-t border-account-outline-variant/30'
        >
          <h2 className='font-serif text-3xl text-account-primary mb-8'>
            Responses
            <span className='text-xl text-account-on-surface-variant/40 font-normal ml-2'>
              ({comments.length})
            </span>
          </h2>

          {isAuthenticated ?
            <form onSubmit={handleAddComment} className='mb-12'>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder='Contribute your thoughts to the journal...'
                className='w-full bg-white border border-account-outline-variant/40 p-4 text-account-primary min-h-[100px] text-sm focus:outline-none focus:border-account-primary'
              />
              <div className='flex justify-end mt-4'>
                <button
                  type='submit'
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className='inline-flex items-center gap-2 bg-account-primary text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 disabled:opacity-50 hover:bg-account-secondary transition-colors'
                >
                  {commentMutation.isPending ? "Posting..." : "Post Response"}
                  <Send className='w-3.5 h-3.5' />
                </button>
              </div>
            </form>
          : <div className='border border-account-outline-variant/30 p-8 text-center mb-12'>
              <Link
                href={loginUrlWithRedirect(`/blog/${slug}`)}
                className='inline-flex bg-account-primary text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 hover:bg-account-secondary transition-colors'
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
                  className='bg-white border border-account-outline-variant/20 p-5 sm:p-6'
                >
                  <div className='flex justify-between gap-4 mb-3'>
                    <span className='font-semibold text-account-primary text-sm'>
                      {comment.user?.name || "Anonymous"}
                    </span>
                    {(user?.role === "admin" ||
                      user?._id === comment.user?._id) && (
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
                        className='text-account-on-surface-variant/40 hover:text-red-600 text-xs font-semibold uppercase flex items-center gap-1'
                      >
                        <Trash2 className='w-3.5 h-3.5' /> Delete
                      </button>
                    )}
                  </div>
                  <p className='text-account-on-surface-variant whitespace-pre-wrap text-sm sm:text-base leading-relaxed'>
                    {comment.content}
                  </p>
                </div>
              ))
            : <p className='text-account-on-surface-variant/50 text-center py-12 text-sm'>
                Be the first to share your thoughts on this story.
              </p>
            }
          </div>
        </section>

        <div className='max-w-account-container mx-auto px-account-margin-mobile md:px-account-margin-desktop mt-account-stack-lg'>
          <BlogNewsletter source='blog_detail' />
        </div>
      </main>
    </div>
  );
}
