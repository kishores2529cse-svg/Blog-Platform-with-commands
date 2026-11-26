import api from './api';
import { Post, Pagination, ApiResponse } from '../types';

export interface GetPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  sort?: string;
  featured?: boolean;
}

export const postService = {
  async getPosts(params: GetPostsParams = {}): Promise<{ posts: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.tag) query.append('tag', params.tag);
    if (params.author) query.append('author', params.author);
    if (params.status) query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);
    if (params.featured) query.append('featured', 'true');

    const response = await api.get<ApiResponse<{ posts: Post[]; pagination: Pagination }>>(
      `/posts?${query.toString()}`
    );
    return response.data.data;
  },

  async getPostBySlug(slug: string): Promise<{ post: Post }> {
    const response = await api.get<ApiResponse<{ post: Post }>>(`/posts/${slug}`);
    return response.data.data;
  },

  async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string | null;
    status: string;
    featured?: boolean;
    categoryId?: string | null;
    tags?: string[];
  }): Promise<{ post: Post }> {
    const response = await api.post<ApiResponse<{ post: Post }>>('/posts', data);
    return response.data.data;
  },

  async updatePost(
    id: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImage?: string | null;
      status?: string;
      featured?: boolean;
      categoryId?: string | null;
      tags?: string[];
    }
  ): Promise<{ post: Post }> {
    const response = await api.put<ApiResponse<{ post: Post }>>(`/posts/${id}`, data);
    return response.data.data;
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  },

  async toggleLikePost(id: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await api.post<ApiResponse<{ liked: boolean; likesCount: number }>>(`/posts/${id}/like`);
    return response.data.data;
  },

  async toggleBookmarkPost(id: string): Promise<{ bookmarked: boolean }> {
    const response = await api.post<ApiResponse<{ bookmarked: boolean }>>(`/posts/${id}/bookmark`);
    return response.data.data;
  },

  async getBookmarkedPosts(): Promise<{ posts: Post[] }> {
    const response = await api.get<ApiResponse<{ posts: Post[] }>>('/posts/bookmarks/all');
    return response.data.data;
  },
};
