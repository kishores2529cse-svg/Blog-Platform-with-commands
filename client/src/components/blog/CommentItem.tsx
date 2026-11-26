import React, { useState } from 'react';
import { Heart, Reply, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Comment, User } from '../../types';
import { Button } from '../ui/Button';

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  postAuthorId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLikeToggle: (commentId: string) => Promise<void>;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  postAuthorId,
  onReply,
  onEdit,
  onDelete,
  onLikeToggle,
  depth = 0,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  const isCommentAuthor = currentUser?.id === comment.author.id;
  const isPostAuthor = currentUser?.id === postAuthorId;
  const isAdmin = currentUser?.role === 'ADMIN';

  const canEdit = isCommentAuthor || isAdmin;
  const canDelete = isCommentAuthor || isPostAuthor || isAdmin;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsSubmittingEdit(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  const isEdited = new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000;

  return (
    <div className={`group relative ${depth > 0 ? 'ml-4 sm:ml-8 pl-3 border-l-2 border-zinc-200 dark:border-zinc-800' : ''}`}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px]">
                {comment.author.displayName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {comment.author.displayName}
            </span>
            {comment.author.role !== 'READER' && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {comment.author.role}
              </span>
            )}
            <span className="text-zinc-400 text-[11px]">{timeAgo}</span>
            {isEdited && <span className="text-zinc-400 text-[10px] italic">(edited)</span>}
          </div>

          {/* Comment Dropdown Menu (Edit/Delete) */}
          {(canEdit || canDelete) && !isEditing && (
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showActionsDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowActionsDropdown(false)} />
                  <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-1 z-40 text-xs">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          setIsEditing(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          if (window.confirm('Delete this comment?')) {
                            onDelete(comment.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Comment Body or Edit Mode */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y min-h-[70px]"
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(false);
                }}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingEdit}
                disabled={!editContent.trim() || editContent.trim() === comment.content}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
            {comment.content}
          </p>
        )}

        {/* Footer Actions (Like, Reply) */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-2.5 text-xs text-zinc-500">
            <button
              onClick={() => onLikeToggle(comment.id)}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                comment.isLiked ? 'text-red-500 font-medium' : ''
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
            </button>

            {currentUser && depth < 3 && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
            <textarea
              placeholder={`Replying to @${comment.author.username}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y min-h-[60px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyContent('');
                  setIsReplying(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingReply}
                disabled={!replyContent.trim()}
              >
                Post Reply
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Nested Replies Rendering */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              postAuthorId={postAuthorId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLikeToggle={onLikeToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
