import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  icon, title, description, action,
}: { icon?: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center animate-fade-in-up">
      {icon && <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-400">{icon}</div>}
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-xs text-sm text-ink/55">{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong', description = "We couldn't load this. Check your connection and try again.", onRetry,
}: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center animate-fade-in-up">
      <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-xs text-sm text-ink/55">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  )
}
