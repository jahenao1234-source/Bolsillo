import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-[var(--superficie-2)] animate-pulse rounded-xl border border-[var(--linea)] ${className}`}
      aria-hidden="true"
    />
  );
};
