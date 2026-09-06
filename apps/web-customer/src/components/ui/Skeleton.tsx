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

/**
 * Every skeleton below mirrors the exact geometry of the component it stands
 * in for — same aspect ratios, same row heights, same gaps. That is the whole
 * point: the grid must not reflow when real data lands (CLS), and the shape of
 * the wait should already tell you what is coming.
 */

export function ProductTileSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-tile bg-white p-2 shadow-tile">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-2.5 w-2/5" />
      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-16 rounded-pill" />
      </div>
    </div>
  )
}

export function ShopCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-card bg-white p-3 shadow-tile">
      <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2 py-0.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductTileSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductRailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[9.5rem] shrink-0">
          <ProductTileSkeleton />
        </div>
      ))}
    </div>
  )
}

export function ShopListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  )
}
