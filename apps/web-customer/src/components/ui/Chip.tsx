import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface ChipProps {
  active?: boolean
  icon?: ReactNode
  count?: number
  size?: 'sm' | 'md'
  /** Scopes the sliding active-pill animation. Two chip rows on the same
   * screen must not share a group, or the pill flies between them. */
  group?: string
  children: ReactNode
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

/**
 * Filter chip. The active state is a filled pill that springs in behind the
 * label via a shared `layoutId`, so moving between chips reads as one control
 * changing value rather than two independent buttons toggling.
 */
export function Chip({
  active, className, children, icon, count, size = 'md', group = 'chip', onClick, ...rest
}: ChipProps) {
  const m = useAppMotion()

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      whileTap={m.tap}
      transition={m.transition}
      className={cn(
        'relative inline-flex shrink-0 items-center gap-1.5 rounded-pill border font-semibold',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        active
          ? 'border-brand text-white'
          : 'border-black/10 bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700',
        className,
      )}
      {...rest}
    >
      {active && (
        <motion.span
          layoutId={`${group}-active`}
          className="absolute inset-0 rounded-pill bg-brand shadow-soft"
          transition={m.reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 480, damping: 34 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {children}
        {typeof count === 'number' && (
          <span
            className={cn(
              'ml-0.5 rounded-full px-1.5 py-px text-2xs tabular-nums',
              active ? 'bg-white/25 text-white' : 'bg-brand-50 text-brand-700',
            )}
          >
            {count}
          </span>
        )}
      </span>
    </motion.button>
  )
}
