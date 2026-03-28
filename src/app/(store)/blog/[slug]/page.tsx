"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, ChevronLeft, Send, Trash2, Calendar, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

import { blogApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Blog, BlogComment, ApiResponse } from "@/types";

export default function BlogDetailPage() {
  const { slug } = useParams() as { slug: string };
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [commentText, setCommentText] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const res: ApiResponse<{ blog: Blog; comments: BlogComment[] }> = await blogApi.getBySlug(slug);
      return res.data;
    },
    enabled: !!slug,
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
    }
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
    }
  });
  
  const deleteCommentMutation = useMutation({
     mutationFn: ({ blogId, commentId }: { blogId: string; commentId: string }) =>
       blogApi.deleteComment(blogId, commentId),
     onSuccess: () => {
        toast.success("Comment deleted");
        queryClient.invalidateQueries({ queryKey: ["blog", slug] });
     }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center pt-5">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="mt-4 text-brand-300/50 text-sm tracking-[0.2em] font-bold uppercase animate-pulse">Loading Story</p>
      </div>
    );
  }

  if (error || !data?.blog) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center pt-5 text-white selection:bg-brand-500/30">
        <h1 className="text-4xl font-extrabold mb-4 text-white">Story Not Found</h1>
        <p className="text-white/50 mb-8 max-w-md text-center">We couldn't locate the journal entry you are looking for.</p>
        <Link 
          href="/blog" 
          className="px-8 py-3 bg-white text-navy-950 rounded-full font-bold hover:bg-gold-50 transition-colors shadow-xl"
        >
          Return to Journal
        </Link>
      </div>
    );
  }

  const { blog, comments } = data;
  const isLikedByMe = isAuthenticated && user ? blog.likes?.includes(user._id) : false;

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
    <div className="bg-navy-950 min-h-screen pt-5 pb-2 selection:bg-brand-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-600/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-gold-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link 
            href="/blog" 
            className="group inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors font-bold text-xs tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Journal
          </Link>
        </div>

        {/* Header Section */}
        <header className="mb-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-brand-300 font-bold tracking-widest uppercase mb-8">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> {blog.author?.name || "The House of Rani"}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-8 drop-shadow-xl break-words overflow-hidden w-full">
            {blog.title}
          </h1>

          <div className="flex items-center justify-center gap-6  border-y border-white/5 bg-navy-900/20 backdrop-blur-sm rounded-3xl max-w-lg mx-auto">
            <button 
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="group flex flex-col items-center gap-1.5 text-white/50 hover:text-white transition-colors disabled:opacity-50"
            >
              <div className={`p-3 rounded-full transition-all duration-300 ${isLikedByMe ? "bg-brand-500/20 shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-brand-500/50" : "bg-white/5 group-hover:bg-brand-500/10"}`}>
                <Heart className={`w-6 h-6 transition-colors ${isLikedByMe ? "fill-brand-400 text-brand-400" : "group-hover:text-brand-400"}`} />
              </div>
              <span className="font-bold text-base">{blog.likes?.length || 0}</span>
            </button>
            <div className="w-px h-12 bg-white/10" />
            <a href="#comments" className="group flex flex-col items-center gap-1.5 text-white/50 hover:text-white transition-colors">
              <div className="p-3 rounded-full bg-white/5 group-hover:bg-gold-500/10 transition-colors">
                <MessageCircle className="w-6 h-6 group-hover:text-gold-400 transition-colors" />
              </div>
              <span className="font-bold text-base">{comments?.length || 0}</span>
            </a>
          </div>
        </header>

        {/* Feature Image if exists (optional top image) */}
        {blog.images && blog.images.length > 0 && (
          <div className="mb-12 group relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f1c] max-w-5xl mx-auto flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <img 
              src={blog.images[0].url} 
              alt={blog.images[0].caption || blog.title} 
              className="w-full h-auto max-h-[75vh] object-contain transition-transform duration-1000 group-hover:scale-[1.02]"
            />
            {blog.images[0].caption && (
               <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
                 <p className="text-white/80 text-sm font-medium italic text-center">{blog.images[0].caption}</p>
               </div>
            )}
          </div>
        )}

        {/* Rich Text Body */}
        <article className="prose prose-invert md:prose-lg max-w-none mb-16 font-light leading-relaxed text-white/80 prose-headings:font-bold prose-headings:text-white prose-a:text-brand-400 hover:prose-a:text-brand-300 prose-blockquote:border-l-brand-500 prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-white/90">
          <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br />') }} />
        </article>

        {/* In-body Image Gallery (Skipping the first one if it was used as hero) */}
        {blog.images && blog.images.length > 1 && (
          <div className="space-y-12 mb-20 max-w-5xl mx-auto">
            {blog.images.slice(1).map((img, idx) => (
              <figure key={img.publicId} className="flex flex-col items-center group">
                <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 bg-[#0a0f1c] flex justify-center">
                  <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                  <img 
                    src={img.url} 
                    alt={img.caption || `Gallery image ${idx + 2}`} 
                    className="w-full h-auto max-h-[85vh] object-contain transition-transform duration-1000 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                </div>
                {img.caption && (
                  <figcaption className="mt-5 text-center text-white/50 text-sm tracking-wide px-4 font-light italic max-w-3xl">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <section id="comments" className="pt-12 pb-8 border-t border-white/10">
          <div className="flex items-end justify-between mb-8">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-md">
              <MessageCircle className="w-8 h-8 text-brand-400" /> 
              Responses
              <span className="text-xl text-white/30 font-normal">({comments?.length || 0})</span>
            </h3>
          </div>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="mb-12 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-gold-600 rounded-[2rem] blur opacity-20" />
              <div className="relative bg-navy-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl flex gap-4 flex-col sm:flex-row">
                <div className="w-12 h-12 shrink-0 rounded-full bg-navy-950 flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
                  {user?.avatar ? (
                     <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-brand-400 font-bold text-lg">{user?.name[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Contribute your thoughts to the journal..."
                    className="w-full bg-transparent border-0 border-b border-white/20 p-0 pb-3 text-white text-base placeholder:text-white/30 focus:ring-0 focus:border-brand-500 min-h-[40px] resize-y transition-colors"
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      type="submit"
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="group inline-flex items-center justify-center rounded-full bg-white text-navy-950 gap-2 font-bold px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-50 shadow-[0_0_15px_-5px_rgba(255,255,255,0.4)] transition-all"
                    >
                      {commentMutation.isPending ? "Posting..." : "Post Response"}
                      {!commentMutation.isPending && <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-navy-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 text-center mb-12 shadow-md">
              <h4 className="text-xl font-bold text-white mb-2">Join the Conversation</h4>
              <p className="text-white/50 mb-6 max-w-sm mx-auto text-sm">Create an account to share your thoughts, style tips, and connect with our community.</p>
              <Link 
                href={`/auth/login?redirect=/blog/${slug}`}
                className="inline-flex bg-white text-navy-950 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gold-50 transition-all hover:scale-105 shadow-lg"
              >
                Log In to Respond
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
               comments.map((comment) => (
                 <div key={comment._id} className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-6 transition-colors duration-300">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-navy-950 flex items-center justify-center overflow-hidden shadow-inner">
                        {comment.user?.avatar ? (
                           <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-lg font-bold text-white/50">{comment.user?.name?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                         <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3 border-b border-white/5 pb-3">
                           <div className="flex items-baseline gap-3">
                              <span className="font-bold text-white text-base">{comment.user?.name || 'Anonymous'}</span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                           </div>
                           {(user?.role === "admin" || user?._id === comment.user?._id) && (
                              <button 
                                onClick={() => {
                                  if (confirm("Remove this comment permanently?")) {
                                    deleteCommentMutation.mutate({ blogId: blog._id, commentId: comment._id })
                                  }
                                }}
                                className="text-white/20 hover:text-rose-500 transition-colors bg-navy-950 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                           )}
                         </div>
                         <p className="text-white/70 leading-relaxed font-light whitespace-pre-wrap text-sm sm:text-base">{comment.content}</p>
                      </div>
                    </div>
                 </div>
               ))
            ) : (
               <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                 <p className="text-white/40 text-base font-light">The conversation hasn't sparked yet. Be the first to opine.</p>
               </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
