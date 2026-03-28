"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Eye, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

import { blogApi } from '@/lib/api';
import { Blog, ApiResponse } from '@/types';

export default function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs', page, search],
    queryFn: async () => {
      const res: ApiResponse<{ blogs: Blog[] }> = await blogApi.getAdminAll({ page, limit: 10, search });
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.delete(id),
    onSuccess: () => {
      toast.success("Blog deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    },
    onError: () => toast.error("Failed to delete blog"),
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post? It cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Manage Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and manage your journal entries.</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Blog
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search blogs..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Blog Post</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading blogs...
                  </td>
                </tr>
              ) : data?.data?.blogs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No blog posts found.
                  </td>
                </tr>
              ) : (
                data?.data?.blogs?.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                          {blog.images && blog.images[0] ? (
                            <Image src={blog.images[0].url} alt="" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1 break-all">{blog.title}</div>
                          <div className="text-xs text-gray-500">{blog.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${blog.isPublished ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'}`}>
                        {blog.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {blog.author?.name || 'Admin'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1" title="Views"><Eye className="w-3.5 h-3.5" />{blog.viewCount}</span>
                        <span className="flex items-center gap-1 text-rose-500" title="Likes"><Heart className="w-3.5 h-3.5" />{blog.likes?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400">
                        <Link href={`/blog/${blog.slug}`} target="_blank" className="p-1 hover:text-gray-900 transition-colors" title="View Public">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/blogs/${blog._id}/edit`} className="p-1 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(blog._id)} disabled={deleteMutation.isPending} className="p-1 hover:text-red-600 transition-colors disabled:opacity-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
         {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!data.pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!data.pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
