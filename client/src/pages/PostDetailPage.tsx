import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Heart,
  Bookmark,
  Share2,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  ArrowLeft,
  Eye,
  Check,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Post } from '../types';
import { postService } from '../services/post.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CommentSection } from '../components/blog/CommentSection';

export const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await postService.getPostBySlug(slug);
        setPost(data.post);
      } catch (err: any) {
        addToast(err.message || 'Story not found', 'error');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate, addToast]);

  const handleLike = async () => {
    if (!isAuthenticated || !post) {
      addToast('Please sign in to like this story', 'info');
      return;
    }
    try {
      const data = await postService.toggleLikePost(post.id);
      setPost((prev) =>
        prev ? { ...prev, isLiked: data.liked, likesCount: data.likesCount } : null
      );
    } catch (err: any) {
      addToast(err.message || 'Error updating like', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !post) {
      addToast('Please sign in to save stories', 'info');
      return;
    }
    try {
      const data = await postService.toggleBookmarkPost(post.id);
      setPost((prev) => (prev ? { ...prev, isBookmarked: data.bookmarked } : null));
      addToast(data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error updating bookmark', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      addToast('Link copied to clipboard', 'success');
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
      try {
        await postService.deletePost(post.id);
        addToast('Story deleted successfully', 'success');
        navigate('/');
      } catch (err: any) {
        addToast(err.message || 'Failed to delete story', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="space-y-3 pt-6">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = user?.id === post.author.id;
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  const sanitizedContent = DOMPurify.sanitize(post.content);

  return (
    <article className="max-w-3xl mx-auto py-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to all stories</span>
      </Link>

      {/* Category Pill */}
      {post.category && (
        <div className="mb-3">
          <Link to={`/?category=${post.category.slug}`}>
            <Badge color={post.category.color}>{post.category.name}</Badge>
          </Link>
        </div>
      )}

      {/* Story Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight mb-4">
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
          {post.excerpt}
        </p>
      )}

      {/* Author and Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-zinc-200/80 dark:border-zinc-800/80 my-6">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3 group"
        >
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm">
              {post.author.displayName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:underline">
                {post.author.displayName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {post.author.role}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {post.publishedAt
                  ? format(new Date(post.publishedAt), 'MMMM d, yyyy')
                  : 'Draft'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingTime} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.views} views
              </span>
            </div>
          </div>
        </Link>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Link to={`/posts/${post.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
                  Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              post.isLiked
                ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          <button
            onClick={handleBookmark}
            aria-label="Bookmark"
            className={`p-2 rounded-full border text-xs transition-colors ${
              post.isBookmarked
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            aria-label="Share story"
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="my-8 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full max-h-[480px] object-cover"
          />
        </div>
      )}

      {/* Article Rich Text Body */}
      <div
        className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-base sm:text-lg leading-relaxed space-y-5"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-1">
            Tags:
          </span>
          {post.tags.map((tag) => (
            <Link key={tag.id} to={`/?tag=${tag.slug}`}>
              <Badge variant="outline">#{tag.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Author Bio Card */}
      <div className="mt-12 p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-5 items-start">
        {post.author.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-14 h-14 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-lg shrink-0">
            {post.author.displayName.charAt(0)}
          </div>
        )}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium">WRITTEN BY</span>
              <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {post.author.displayName}
              </h4>
            </div>
            <Link to={`/profile/${post.author.username}`}>
              <Button size="sm" variant="outline">
                View Profile
              </Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {post.author.bio || 'Author at Chronicle.'}
          </p>
        </div>
      </div>

      {/* Real-time Nested Comments Section */}
      <CommentSection postId={post.id} postAuthorId={post.author.id} />
    </article>
  );
};
