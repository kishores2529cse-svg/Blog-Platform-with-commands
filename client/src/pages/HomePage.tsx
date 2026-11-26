import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Post, Category, Tag } from '../types';
import { postService } from '../services/post.service';
import { categoryService } from '../services/category.service';
import { PostCard } from '../components/blog/PostCard';
import { PostFilters } from '../components/blog/PostFilters';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters from query params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'latest';
  const pageParam = parseInt(searchParams.get('page') || '1');

  // Fetch Categories & Tags on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          categoryService.getCategories(),
          categoryService.getTags(),
        ]);
        setCategories(catRes.categories);
        setTags(tagRes.tags);
      } catch {
        // ignore
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Posts whenever filters change
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await postService.getPosts({
        page: pageParam,
        limit: 9,
        search: search || undefined,
        category: category || undefined,
        tag: tag || undefined,
        sort,
      });

      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setCurrentPage(data.pagination.page);
    } catch (err: any) {
      addToast(err.message || 'Error loading posts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [pageParam, search, category, tag, sort, addToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update URL filter parameters
  const updateFilters = (newParams: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        updated.set(k, v);
      } else {
        updated.delete(k);
      }
    });
    // Reset to page 1 on filter changes unless page itself was updated
    if (!('page' in newParams)) {
      updated.delete('page');
    }
    setSearchParams(updated);
  };

  const handleLikeToggle = async (postId: string) => {
    if (!isAuthenticated) {
      addToast('Please sign in to like this story', 'info');
      return;
    }
    try {
      const data = await postService.toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: data.liked, likesCount: data.likesCount }
            : p
        )
      );
    } catch (err: any) {
      addToast(err.message || 'Error updating like', 'error');
    }
  };

  const handleBookmarkToggle = async (postId: string) => {
    if (!isAuthenticated) {
      addToast('Please sign in to save stories', 'info');
      return;
    }
    try {
      const data = await postService.toggleBookmarkPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isBookmarked: data.bookmarked } : p))
      );
      addToast(data.bookmarked ? 'Story saved to bookmarks' : 'Removed from bookmarks', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error saving story', 'error');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="mb-10 pb-8 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-3 border border-zinc-200 dark:border-zinc-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Curated Engineering & Architecture Perspectives</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Stories, insights & systems for modern builders.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Read in-depth explorations on software architecture, clean design, database internals, and real-time systems from engineering leaders.
          </p>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <PostFilters
        search={search}
        onSearchChange={(val) => updateFilters({ search: val })}
        selectedCategory={category}
        onCategoryChange={(slug) => updateFilters({ category: slug })}
        selectedTag={tag}
        onTagChange={(slug) => updateFilters({ tag: slug })}
        sortBy={sort}
        onSortChange={(val) => updateFilters({ sort: val })}
        categories={categories}
        tags={tags}
        onClearFilters={() => setSearchParams({})}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-6">
        <span>
          Showing {posts.length} of {totalCount} {totalCount === 1 ? 'story' : 'stories'}
        </span>
        {category && (
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Topic: {categories.find((c) => c.slug === category)?.name || category}
          </span>
        )}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/60 dark:border-zinc-800/60"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
            No stories match your criteria
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing your topic filters, or browse all topics.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-md"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onBookmarkToggle={handleBookmarkToggle}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => updateFilters({ page: page.toString() })}
      />
    </div>
  );
};
