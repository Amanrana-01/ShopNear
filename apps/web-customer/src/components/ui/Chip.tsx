import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Chip({
  active, className, children, icon, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium',
        'transition-colors duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        active
          ? 'border-brand bg-brand text-white shadow-soft'
          : 'border-black/10 bg-white text-ink/70 hover:border-brand-200 hover:text-brand-700',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
