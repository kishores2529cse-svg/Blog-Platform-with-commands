export type UserRole = 'ADMIN' | 'AUTHOR' | 'READER';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  github?: string | null;
  twitter?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    posts?: number;
    comments?: number;
    bookmarks?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  postsCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postsCount?: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  readingTime: number;
  status: PostStatus;
  featured: boolean;
  views: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    role: UserRole;
    website?: string | null;
    github?: string | null;
    twitter?: string | null;
  };
  category?: Category | null;
  tags: Tag[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    role: UserRole;
  };
  likesCount: number;
  isLiked?: boolean;
  replies?: Comment[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
