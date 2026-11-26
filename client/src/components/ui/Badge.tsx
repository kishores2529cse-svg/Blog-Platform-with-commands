import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'role';
  color?: string | null;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  color,
  className = '',
  onClick,
}) => {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide transition-colors';

  const clickable = onClick ? 'cursor-pointer hover:opacity-80' : '';

  if (color) {
    return (
      <span
        onClick={onClick}
        className={`${base} border ${clickable} ${className}`}
        style={{
          borderColor: `${color}40`,
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        {children}
      </span>
    );
  }

  const variants = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700',
    outline: 'bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
    role: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold',
  };

  return (
    <span onClick={onClick} className={`${base} ${variants[variant]} ${clickable} ${className}`}>
      {children}
    </span>
  );
};
