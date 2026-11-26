import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-4">
      <div className="text-6xl font-black text-zinc-300 dark:text-zinc-800">404</div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Page not found</h1>
      <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
        The story, topic, or profile you are looking for does not exist or may have been removed.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
