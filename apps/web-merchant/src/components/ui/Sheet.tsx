import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { IconX } from './Icon'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in-up"
      />
      <div
        className={cn(
          'relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop animate-slide-up',
          'sm:max-w-md sm:rounded-3xl sm:animate-pop-in',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/10 sm:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-ink/50 hover:bg-brand-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <IconX size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
