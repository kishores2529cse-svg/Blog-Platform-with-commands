import api from './api';
import { User, ApiResponse } from '../types';

export const authService = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
    role?: string;
  }): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return response.data.data;
  },

  async login(data: { login: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<{ user: User }> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: {
    displayName?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    website?: string | null;
    github?: string | null;
    twitter?: string | null;
  }): Promise<{ user: User }> {
    const response = await api.put<ApiResponse<{ user: User }>>('/users/profile', data);
    return response.data.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/users/change-password', data);
  },

  async getUserProfile(username: string): Promise<{ user: User & { posts: any[] } }> {
    const response = await api.get<ApiResponse<{ user: User & { posts: any[] } }>>(`/users/profile/${username}`);
    return response.data.data;
  },

  async listUsers(page = 1, limit = 20): Promise<{ users: User[]; pagination: any }> {
    const response = await api.get<ApiResponse<{ users: User[]; pagination: any }>>(`/users?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  async updateUserRole(userId: string, role: string): Promise<{ user: User }> {
    const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}/role`, { role });
    return response.data.data;
  },
};
