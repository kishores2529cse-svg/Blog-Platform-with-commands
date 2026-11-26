import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Comment } from '../../types';
import { commentService } from '../../services/comment.service';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { CommentItem } from './CommentItem';
import { Button } from '../ui/Button';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, postAuthorId }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, joinPostRoom, leavePostRoom } = useSocket();
  const { addToast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch initial comments
  const fetchComments = useCallback(async () => {
    try {
      const data = await commentService.getComments(postId);
      setComments(data.comments);
      setTotalCount(data.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time WebSocket room subscriptions and listeners
  useEffect(() => {
    if (!postId) return;

    joinPostRoom(postId);

    if (socket) {
      const handleCreated = (newComment: Comment) => {
        setComments((prevComments) => {
          // If top level comment
          if (!newComment.parentId) {
            // Check if already in list (e.g. from current user's direct optimistic update)
            if (prevComments.some((c) => c.id === newComment.id)) return prevComments;
            return [newComment, ...prevComments];
          }

          // Recursive helper to insert reply into parent
          const insertReply = (list: Comment[]): Comment[] => {
            return list.map((item) => {
              if (item.id === newComment.parentId) {
                const existingReplies = item.replies || [];
                if (existingReplies.some((r) => r.id === newComment.id)) return item;
                return {
                  ...item,
                  replies: [...existingReplies, newComment],
                };
              }
              if (item.replies && item.replies.length > 0) {
                return {
                  ...item,
                  replies: insertReply(item.replies),
                };
              }
              return item;
            });
          };

          return insertReply(prevComments);
        });
        setTotalCount((prev) => prev + 1);
      };

      const handleUpdated = (updatedComment: Comment) => {
        const updateInTree = (list: Comment[]): Comment[] => {
          return list.map((item) => {
            if (item.id === updatedComment.id) {
              return {
                ...item,
                content: updatedComment.content,
                updatedAt: updatedComment.updatedAt,
              };
            }
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: updateInTree(item.replies),
              };
            }
            return item;
          });
        };
        setComments((prev) => updateInTree(prev));
      };

      const handleDeleted = ({ commentId }: { commentId: string }) => {
        const deleteFromTree = (list: Comment[]): Comment[] => {
          return list
            .filter((item) => item.id !== commentId)
            .map((item) => {
              if (item.replies && item.replies.length > 0) {
                return {
                  ...item,
                  replies: deleteFromTree(item.replies),
                };
              }
              return item;
            });
        };
        setComments((prev) => deleteFromTree(prev));
        setTotalCount((prev) => Math.max(0, prev - 1));
      };

      const handleLikeUpdated = ({
        commentId,
        likesCount,
      }: {
        commentId: string;
        likesCount: number;
      }) => {
        const updateLikeInTree = (list: Comment[]): Comment[] => {
          return list.map((item) => {
            if (item.id === commentId) {
              return { ...item, likesCount };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: updateLikeInTree(item.replies) };
            }
            return item;
          });
        };
        setComments((prev) => updateLikeInTree(prev));
      };

      socket.on('comment:created', handleCreated);
      socket.on('comment:updated', handleUpdated);
      socket.on('comment:deleted', handleDeleted);
      socket.on('comment:like_updated', handleLikeUpdated);

      return () => {
        socket.off('comment:created', handleCreated);
        socket.off('comment:updated', handleUpdated);
        socket.off('comment:deleted', handleDeleted);
        socket.off('comment:like_updated', handleLikeUpdated);
        leavePostRoom(postId);
      };
    }
  }, [socket, postId, joinPostRoom, leavePostRoom]);

  // Create new root comment
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!isAuthenticated) {
      addToast('Please sign in to leave a comment', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await commentService.createComment(postId, {
        content: newCommentText.trim(),
      });
      // Add optimistically if not immediately received via socket
      setComments((prev) => {
        if (prev.some((c) => c.id === data.comment.id)) return prev;
        return [data.comment, ...prev];
      });
      setTotalCount((prev) => prev + 1);
      setNewCommentText('');
      addToast('Comment published', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply to existing comment
  const handleReply = async (parentId: string, content: string) => {
    if (!isAuthenticated) {
      addToast('Please sign in to reply', 'info');
      return;
    }

    try {
      const data = await commentService.createComment(postId, {
        content,
        parentId,
      });

      // Update locally
      const insertReply = (list: Comment[]): Comment[] => {
        return list.map((item) => {
          if (item.id === parentId) {
            const replies = item.replies || [];
            if (replies.some((r) => r.id === data.comment.id)) return item;
            return {
              ...item,
              replies: [...replies, data.comment],
            };
          }
          if (item.replies && item.replies.length > 0) {
            return {
              ...item,
              replies: insertReply(item.replies),
            };
          }
          return item;
        });
      };

      setComments((prev) => insertReply(prev));
      setTotalCount((prev) => prev + 1);
      addToast('Reply sent', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to post reply', 'error');
    }
  };

  // Edit comment
  const handleEdit = async (commentId: string, content: string) => {
    try {
      await commentService.updateComment(commentId, content);
      const updateInTree = (list: Comment[]): Comment[] => {
        return list.map((item) => {
          if (item.id === commentId) {
            return { ...item, content, updatedAt: new Date().toISOString() };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: updateInTree(item.replies) };
          }
          return item;
        });
      };
      setComments((prev) => updateInTree(prev));
      addToast('Comment updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update comment', 'error');
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      const deleteFromTree = (list: Comment[]): Comment[] => {
        return list
          .filter((item) => item.id !== commentId)
          .map((item) => {
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: deleteFromTree(item.replies) };
            }
            return item;
          });
      };
      setComments((prev) => deleteFromTree(prev));
      setTotalCount((prev) => Math.max(0, prev - 1));
      addToast('Comment deleted', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  // Like comment
  const handleLikeToggle = async (commentId: string) => {
    if (!isAuthenticated) {
      addToast('Please sign in to like comments', 'info');
      return;
    }

    try {
      const data = await commentService.toggleLikeComment(commentId);
      const updateLikeInTree = (list: Comment[]): Comment[] => {
        return list.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              isLiked: data.liked,
              likesCount: data.likesCount,
            };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: updateLikeInTree(item.replies) };
          }
          return item;
        });
      };
      setComments((prev) => updateLikeInTree(prev));
    } catch (err: any) {
      addToast(err.message || 'Error liking comment', 'error');
    }
  };

  return (
    <section id="comments" className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <MessageSquare className="w-5 h-5" />
          <span>Responses</span>
          <span className="text-sm font-normal text-zinc-500">({totalCount})</span>
        </h3>
        <span className="text-xs text-zinc-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Live sync active
        </span>
      </div>

      {/* Write New Comment Form */}
      <form onSubmit={handleCreateComment} className="mb-8">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-white dark:bg-zinc-900 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <textarea
            placeholder={
              isAuthenticated
                ? 'What are your thoughts on this article? Join the discussion...'
                : 'Sign in to join the discussion and leave a comment...'
            }
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={!isAuthenticated || isSubmitting}
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-y min-h-[80px]"
          />

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-400">
              {newCommentText.length > 0 && `${newCommentText.length}/2000`}
            </span>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!isAuthenticated || !newCommentText.trim()}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Publish Response
            </Button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-zinc-400">Loading responses...</div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No responses yet.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Be the first to share your thoughts and start the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              postAuthorId={postAuthorId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
};
