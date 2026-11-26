import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Category, Tag } from '../../types';

interface PostFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  selectedTag: string;
  onTagChange: (slug: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: Category[];
  tags: Tag[];
  onClearFilters: () => void;
}

export const PostFilters: React.FC<PostFiltersProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  categories,
  tags,
  onClearFilters,
}) => {
  const hasActiveFilters = !!search || !!selectedCategory || !!selectedTag || sortBy !== 'latest';

  return (
    <div className="space-y-4 mb-8">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search articles by title, topic, or keyword..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1.5 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors shrink-0 ${
            !selectedCategory
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
          }`}
        >
          All Topics
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors shrink-0 flex items-center gap-1.5 ${
              selectedCategory === cat.slug
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            {cat.color && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            )}
            <span>{cat.name}</span>
            {cat.postsCount !== undefined && (
              <span className="text-[10px] opacity-60">({cat.postsCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tag Chips (if any selected or when browsing) */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-zinc-500 pt-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mr-1">
            Tags:
          </span>
          {tags.slice(0, 10).map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagChange(selectedTag === tag.slug ? '' : tag.slug)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedTag === tag.slug
                  ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
