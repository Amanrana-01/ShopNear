import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { useAppMotion, fadeUp } from '@/lib/motion'

/**
 * Empty and error states always carry a way forward. In a radius-limited
 * catalogue "nothing here" is almost always fixable by widening the search or
 * clearing a filter, so the action is part of the component rather than an
 * afterthought the caller might forget.
 */
export function EmptyState({
  icon, title, description, action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  const m = useAppMotion()
  return (
    <motion.div
      variants={m.variants(fadeUp)}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-2.5 px-6 py-14 text-center"
    >
      {icon && (
        <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-extrabold tracking-tight text-ink">{title}</h3>
      {description && <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-1.5">
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
}: { title?: string; description?: string; onRetry?: () => void }) {
  const m = useAppMotion()
  return (
    <motion.div
      variants={m.variants(fadeUp)}
      initial="hidden"
      animate="show"
      role="alert"
      className="flex flex-col items-center gap-2.5 px-6 py-14 text-center"
    >
      <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle size={28} aria-hidden />
      </div>
      <h3 className="font-display text-base font-extrabold tracking-tight text-ink">{title}</h3>
      <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1.5">
          Try again
        </Button>
      )}
    </motion.div>
  )
}
