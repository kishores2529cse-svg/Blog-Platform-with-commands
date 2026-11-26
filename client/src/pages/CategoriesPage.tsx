import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { Category } from '../types';
import { categoryService } from '../services/category.service';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data.categories);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="py-6 space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          <span>Explore Topics</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Browse specialized engineering, architecture, and design themes.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading topics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/?category=${cat.slug}`}
              className="p-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {cat.description || 'Curated stories and architectural insights in this subject.'}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>{cat.postsCount || 0} published stories</span>
                <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
