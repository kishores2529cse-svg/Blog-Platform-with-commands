import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { Post } from '../types';
import { postService } from '../services/post.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PostCard } from '../components/blog/PostCard';

export const BookmarksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const data = await postService.getBookmarkedPosts();
        setBookmarks(data.posts);
      } catch (err: any) {
        addToast(err.message || 'Error loading saved stories', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, addToast]);

  const handleBookmarkToggle = async (postId: string) => {
    try {
      const data = await postService.toggleBookmarkPost(postId);
      if (!data.bookmarked) {
        setBookmarks((prev) => prev.filter((p) => p.id !== postId));
      }
      addToast('Bookmarks updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error updating bookmark', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <Bookmark className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Saved Stories</h2>
        <p className="text-xs text-zinc-500 mt-2 mb-6">
          Sign in to access your personal reading list and save stories for offline reading.
        </p>
        <Link
          to="/login"
          className="inline-block px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md text-xs font-semibold"
        >
          Sign in to Chronicle
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 fill-current" />
            <span>Saved Stories</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Your private reading list</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading your saved stories...</div>
      ) : bookmarks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No saved stories yet.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Click the bookmark icon on any story to save it to your reading list.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-xs font-semibold text-zinc-900 dark:text-zinc-100 underline"
          >
            Explore Stories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onBookmarkToggle={() => handleBookmarkToggle(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
