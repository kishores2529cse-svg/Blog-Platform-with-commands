import api from './api';
import { Category, Tag, ApiResponse } from '../types';

export const categoryService = {
  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    return response.data.data;
  },

  async createCategory(data: { name: string; description?: string; color?: string }): Promise<{ category: Category }> {
    const response = await api.post<ApiResponse<{ category: Category }>>('/categories', data);
    return response.data.data;
  },

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; color?: string }
  ): Promise<{ category: Category }> {
    const response = await api.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);
    return response.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async getTags(): Promise<{ tags: Tag[] }> {
    const response = await api.get<ApiResponse<{ tags: Tag[] }>>('/tags');
    return response.data.data;
  },
};
