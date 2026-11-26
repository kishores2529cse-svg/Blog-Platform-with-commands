import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../../types';
import { Badge } from '../ui/Badge';

interface PostCardProps {
  post: Post;
  onBookmarkToggle?: (postId: string) => void;
  onLikeToggle?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onBookmarkToggle,
  onLikeToggle,
}) => {
  const publishedDate = post.publishedAt
    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
    : 'Draft';

  return (
    <article className="group flex flex-col justify-between p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-sm hover:shadow">
      <div>
        {/* Author header */}
        <div className="flex items-center justify-between mb-3">
          <Link
            to={`/profile/${post.author.username}`}
            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.displayName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                {post.author.displayName.charAt(0)}
              </div>
            )}
            <span className="font-medium text-zinc-900 dark:text-zinc-200">
              {post.author.displayName}
            </span>
          </Link>

          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime} min read
          </span>
        </div>

        {/* Cover image if available */}
        {post.coverImage && (
          <Link to={`/posts/${post.slug}`} className="block mb-3.5 overflow-hidden rounded-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-44 object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          </Link>
        )}

        {/* Post Title & Excerpt */}
        <Link to={`/posts/${post.slug}`} className="block">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {post.excerpt}
          </p>
        </Link>
      </div>

      {/* Meta Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          {post.category && (
            <Link to={`/?category=${post.category.slug}`}>
              <Badge color={post.category.color}>{post.category.name}</Badge>
            </Link>
          )}
          <span className="text-[11px] text-zinc-400">{publishedDate}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            onClick={() => onLikeToggle && onLikeToggle(post.id)}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              post.isLiked ? 'text-red-500 font-semibold' : ''
            }`}
            title="Like post"
          >
            <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{post.likesCount}</span>
          </button>

          {/* Comments count */}
          <Link
            to={`/posts/${post.slug}#comments`}
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs">{post.commentsCount}</span>
          </Link>

          {/* Bookmark */}
          <button
            onClick={() => onBookmarkToggle && onBookmarkToggle(post.id)}
            className={`hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ${
              post.isBookmarked ? 'text-zinc-900 dark:text-zinc-100' : ''
            }`}
            title="Save for later"
          >
            <Bookmark className={`w-3.5 h-3.5 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
