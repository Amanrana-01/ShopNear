import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-brand-50',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent',
        'before:animate-shimmer',
        className,
      )}
    />
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-brand-100 bg-white p-4 shadow-soft">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
