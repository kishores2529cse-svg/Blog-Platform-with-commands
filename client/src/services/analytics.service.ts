import api from './api';
import { ApiResponse } from '../types';

export interface AnalyticsStats {
  totalPublished: number;
  totalDrafts: number;
  totalViews: number;
  totalComments: number;
  totalUsers?: number;
}

export interface AnalyticsTopPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  publishedAt?: string;
}

export const analyticsService = {
  async getOverview(): Promise<{ stats: AnalyticsStats; topPosts: AnalyticsTopPost[] }> {
    const response = await api.get<ApiResponse<{ stats: AnalyticsStats; topPosts: AnalyticsTopPost[] }>>(
      '/analytics/overview'
    );
    return response.data.data;
  },
};
