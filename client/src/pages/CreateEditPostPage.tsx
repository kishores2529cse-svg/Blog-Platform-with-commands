import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, ArrowLeft, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Category, Tag } from '../types';
import { postService } from '../services/post.service';
import { categoryService } from '../services/category.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RichTextEditor } from '../components/blog/RichTextEditor';

export const CreateEditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [featured, setFeatured] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Authorization check: only AUTHOR and ADMIN can access this page
  useEffect(() => {
    if (user && user.role === 'READER') {
      addToast('Authors and administrators only', 'error');
      navigate('/');
    }
  }, [user, navigate, addToast]);

  // Load available categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setAvailableCategories(data.categories);
      } catch {
        // ignore
      }
    };
    loadCategories();
  }, []);

  // If editing, load post data
  useEffect(() => {
    if (!id) return;
    const loadPost = async () => {
      try {
        const data = await postService.getPosts({ limit: 50 });
        const postToEdit = data.posts.find((p) => p.id === id);
        if (!postToEdit) {
          addToast('Story not found', 'error');
          navigate('/dashboard');
          return;
        }

        setTitle(postToEdit.title);
        setExcerpt(postToEdit.excerpt || '');
        setContent(postToEdit.content || '');
        setCoverImage(postToEdit.coverImage || '');
        setCategoryId(postToEdit.category?.id || '');
        setStatus(postToEdit.status as 'DRAFT' | 'PUBLISHED');
        setFeatured(postToEdit.featured || false);
        setTags(postToEdit.tags.map((t) => t.name));
      } catch (err: any) {
        addToast(err.message || 'Error loading story for edit', 'error');
      } finally {
        setIsFetching(false);
      }
    };

    loadPost();
  }, [id, navigate, addToast]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required (minimum 3 characters)';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    // Cover image validation
    const trimmedCover = coverImage.trim();
    if (trimmedCover) {
      const isValidUrl =
        trimmedCover.startsWith('http://') ||
        trimmedCover.startsWith('https://') ||
        trimmedCover.startsWith('/') ||
        trimmedCover.startsWith('data:image/');
      if (!isValidUrl) {
        newErrors.coverImage =
          'Cover image must be a valid URL starting with http:// or https:// (or left blank)';
      }
    }

    // Content validation
    const plainText = content.replace(/<[^>]*>?/gm, '').trim();
    if (!content.trim() || content === '<p></p>' || plainText.length === 0) {
      newErrors.content = 'Story body cannot be empty. Please write your story in the editor below.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorMessage = Object.values(newErrors)[0];
      addToast(firstErrorMessage, 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!validateForm()) {
      return;
    }

    const trimmedCover = coverImage.trim();
    const finalCoverImage = trimmedCover ? trimmedCover : null;

    setIsLoading(true);
    try {
      if (isEditing && id) {
        const data = await postService.updatePost(id, {
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || undefined,
          coverImage: finalCoverImage,
          status: submitStatus,
          featured,
          categoryId: categoryId || null,
          tags,
        });
        addToast(
          submitStatus === 'PUBLISHED' ? 'Story published!' : 'Draft updated!',
          'success'
        );
        navigate(`/posts/${data.post.slug}`);
      } else {
        const data = await postService.createPost({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || undefined,
          coverImage: finalCoverImage,
          status: submitStatus,
          featured,
          categoryId: categoryId || null,
          tags,
        });
        addToast(
          submitStatus === 'PUBLISHED' ? 'Story published successfully!' : 'Draft saved!',
          'success'
        );
        navigate(`/posts/${data.post.slug}`);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save story', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isCoverUrlCandidate =
    coverImage.trim().startsWith('http://') ||
    coverImage.trim().startsWith('https://') ||
    coverImage.trim().startsWith('/') ||
    coverImage.trim().startsWith('data:image/');

  if (isFetching) {
    return <div className="py-20 text-center text-sm text-zinc-400">Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle Preview Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            {isPreview ? 'Edit Mode' : 'Preview'}
          </Button>

          {/* Save as Draft */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isLoading && status === 'DRAFT'}
            onClick={() => handleSubmit('DRAFT')}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Draft
          </Button>

          {/* Publish */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isLoading && status === 'PUBLISHED'}
            onClick={() => handleSubmit('PUBLISHED')}
          >
            {isEditing && status === 'PUBLISHED' ? 'Update & Publish' : 'Publish Story'}
          </Button>
        </div>
      </div>

      {isPreview ? (
        /* Preview Mode */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 max-w-3xl mx-auto shadow-sm">
          <div className="mb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded">
              Preview Mode
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-3">
            {title || 'Untitled Story'}
          </h1>
          {excerpt && <p className="text-base text-zinc-500 mb-6">{excerpt}</p>}
          {coverImage && isCoverUrlCandidate && !imageLoadError && (
            <img
              src={coverImage}
              alt="Cover Preview"
              className="w-full max-h-96 object-cover rounded-lg mb-6"
            />
          )}
          <div
            className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Story Title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none border-b pb-3 ${
                errors.title
                  ? 'border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Metadata Row: Category and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Category / Topic
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-2 px-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                <option value="">Select Topic...</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Tags (Press Enter to add)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 min-h-[38px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={tags.length === 0 ? 'e.g. typescript, architecture' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none px-1"
                />
              </div>
            </div>
          </div>

          {/* Excerpt and Cover Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Short Excerpt / Subtitle"
              placeholder="Brief summary to entice readers..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
            <div>
              <Input
                label="Cover Image URL (Optional)"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setImageLoadError(false);
                  if (errors.coverImage) setErrors((prev) => ({ ...prev, coverImage: '' }));
                }}
                leftIcon={<ImageIcon className="w-4 h-4" />}
                error={errors.coverImage}
                helperText="Must start with http:// or https:// (leave blank if no cover)"
              />
              {coverImage && (
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      setImageLoadError(false);
                      setErrors((prev) => ({ ...prev, coverImage: '' }));
                    }}
                    className="text-[11px] text-zinc-500 hover:text-red-500 underline"
                  >
                    Clear Cover Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {coverImage && isCoverUrlCandidate && !imageLoadError && (
            <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-48 bg-zinc-100 dark:bg-zinc-800">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-48 object-cover"
                onError={() => setImageLoadError(true)}
              />
            </div>
          )}

          {/* Rich Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Story Body
              </label>
              {errors.content && (
                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.content}
                </span>
              )}
            </div>
            <RichTextEditor
              content={content}
              onChange={(val) => {
                setContent(val);
                if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
              }}
            />
          </div>
        </form>
      )}
    </div>
  );
};
