import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  ...props
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variants[variant],
        className
      )}
      style={style}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={60} height={20} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="60%" height={20} />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
          <Skeleton variant="text" width={60} height={20} />
        </div>
      ))}
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </div>
  );
};
