import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useAppMotion, sheetVariants, scrimVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * A bottom sheet on mobile, centred modal on wider screens — used for filters,
 * sort, the cart drawer, and the location picker.
 *
 * The mobile sheet is draggable: a downward flick past a quarter of its height
 * (or any fast downward throw) dismisses it, which is the gesture people
 * already expect from every native sheet.
 */
export function Sheet({ open, onClose, title, description, children, className }: SheetProps) {
  const m = useAppMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the sheet so the keyboard path matches the visual one.
    const id = window.setTimeout(() => panelRef.current?.focus(), 40)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(id)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            aria-label="Close"
            onClick={onClose}
            variants={scrimVariants}
            initial="hidden"
            animate="show"
            exit="leave"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            variants={m.variants(sheetVariants)}
            initial="hidden"
            animate="show"
            exit="leave"
            drag={m.reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
            className={cn(
              'relative z-10 max-h-[86vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5',
              'pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift outline-none',
              'sm:max-w-md sm:rounded-3xl',
              className,
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-black/10 sm:hidden" />
            {title && (
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
                  {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
