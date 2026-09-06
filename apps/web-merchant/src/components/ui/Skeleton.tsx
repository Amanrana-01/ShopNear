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

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-card bg-white p-4 shadow-soft', className)}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
