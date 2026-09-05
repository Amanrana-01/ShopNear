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

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-white p-2.5 shadow-soft">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-2/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  )
}

export function ShopCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-card bg-white p-3 shadow-soft">
      <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2 py-0.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ShopListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  )
}
