import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0b0c10] py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Chronicle
            </span>
            <span className="text-zinc-400 text-xs">— Modern, Minimalist Publishing Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Explore
            </Link>
            <Link to="/categories" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Categories
            </Link>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              API Status
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} Chronicle Publishing Engine. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Engineered with React, TypeScript, Express, Prisma & SQLite</p>
        </div>
      </div>
    </footer>
  );
};
