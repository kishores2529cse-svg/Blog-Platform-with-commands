import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  MessageSquare,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyticsService, AnalyticsStats, AnalyticsTopPost } from '../services/analytics.service';
import { postService } from '../services/post.service';
import { authService } from '../services/auth.service';
import { categoryService } from '../services/category.service';
import { Post, User, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'categories'>('posts');

  // Analytics state
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [topPosts, setTopPosts] = useState<AnalyticsTopPost[]>([]);

  // Post management state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postStatusFilter, setPostStatusFilter] = useState<string>('ALL');
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);

  // User management state (Admin only)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Category management state (Admin only)
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563eb');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Fetch overview metrics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getOverview();
        setStats(data.stats);
        setTopPosts(data.topPosts);
      } catch {
        // ignore
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch posts for management
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const data = await postService.getPosts({
        limit: 50,
        status: postStatusFilter === 'ALL' ? undefined : postStatusFilter,
        author: isAdmin ? undefined : user?.username,
      });
      setPosts(data.posts);
    } catch (err: any) {
      addToast(err.message || 'Error loading posts', 'error');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [postStatusFilter, isAdmin, user?.username, addToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch users list (for admin tab)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const data = await authService.listUsers();
      setUsersList(data.users);
    } catch (err: any) {
      addToast(err.message || 'Error loading users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin, addToast]);

  // Fetch categories (for admin tab)
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategoriesList(data.categories);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, isAdmin, fetchUsers, fetchCategories]);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Delete this story permanently?')) {
      try {
        await postService.deletePost(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        addToast('Story deleted', 'success');
      } catch (err: any) {
        addToast(err.message || 'Failed to delete story', 'error');
      }
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await authService.updateUserRole(targetUserId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole as any } : u))
      );
      addToast('User role updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error updating role', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const data = await categoryService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        color: newCatColor,
      });
      setCategoriesList((prev) => [...prev, data.category]);
      setIsCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      addToast('Category created', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (window.confirm('Delete this category? Associated posts will be preserved.')) {
      try {
        await categoryService.deleteCategory(catId);
        setCategoriesList((prev) => prev.filter((c) => c.id !== catId));
        addToast('Category removed', 'success');
      } catch (err: any) {
        addToast(err.message || 'Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {isAdmin ? 'Editorial & Platform Console' : 'Author Studio'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage your published stories, track performance metrics, and moderate discussions.
          </p>
        </div>

        <Link to="/posts/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Story
          </Button>
        </Link>
      </div>

      {/* Analytics Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Views</span>
              <Eye className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalViews.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalPublished}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Drafts</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalDrafts}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Responses</span>
              <MessageSquare className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalComments}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'posts'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Stories ({posts.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Permissions</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Topics & Categories</span>
          </button>
        )}
      </div>

      {/* Tab: Stories Table */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Status:</span>
              {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPostStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    postStatusFilter === st
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Topic</th>
                  {isAdmin && <th className="p-4">Author</th>}
                  <th className="p-4 text-center">Views</th>
                  <th className="p-4 text-center">Likes</th>
                  <th className="p-4 text-center">Comments</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {isLoadingPosts ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                      Loading stories...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                      No stories found in this view.
                    </td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                        <Link to={`/posts/${p.slug}`} className="hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.category ? (
                          <Badge color={p.category.color}>{p.category.name}</Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">
                          @{p.author.username}
                        </td>
                      )}
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">{p.views}</td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                        {p.likesCount}
                      </td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                        {p.commentsCount}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Link to={`/posts/${p.id}/edit`}>
                          <button
                            title="Edit story"
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          title="Delete story"
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: User Management (Admin only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Stories</th>
                  <th className="p-4 text-center">Responses</th>
                  <th className="p-4 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 text-xs">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px]">
                            {u.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p>{u.displayName}</p>
                          <p className="text-[11px] text-zinc-400 font-normal">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                      <td className="p-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                        {u._count?.posts || 0}
                      </td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">
                        {u._count?.comments || 0}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
                        >
                          <option value="READER">READER</option>
                          <option value="AUTHOR">AUTHOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Category Management (Admin only) */}
      {activeTab === 'categories' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-500">Organize articles by core subject topics.</p>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Add Topic
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      />
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {cat.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-zinc-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span>Slug: {cat.slug}</span>
                  <span>{cat.postsCount || 0} stories</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Modal */}
          <Modal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            title="Create New Topic Category"
          >
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                label="Topic Name"
                placeholder="e.g. Cloud Architecture"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <Input
                label="Description"
                placeholder="Short summary of this topic..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-500">{newCatColor}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isCreatingCat}>
                  Create Topic
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};
