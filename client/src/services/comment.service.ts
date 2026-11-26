import api from './api';
import { Comment, ApiResponse } from '../types';

export const commentService = {
  async getComments(postId: string): Promise<{ comments: Comment[]; total: number }> {
    const response = await api.get<ApiResponse<{ comments: Comment[]; total: number }>>(
      `/posts/${postId}/comments`
    );
    return response.data.data;
  },

  async createComment(
    postId: string,
    data: { content: string; parentId?: string | null }
  ): Promise<{ comment: Comment }> {
    const response = await api.post<ApiResponse<{ comment: Comment }>>(
      `/posts/${postId}/comments`,
      data
    );
    return response.data.data;
  },

  async updateComment(commentId: string, content: string): Promise<{ comment: Comment }> {
    const response = await api.put<ApiResponse<{ comment: Comment }>>(`/comments/${commentId}`, {
      content,
    });
    return response.data.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },

  async toggleLikeComment(commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await api.post<ApiResponse<{ liked: boolean; likesCount: number }>>(
      `/comments/${commentId}/like`
    );
    return response.data.data;
  },
};
