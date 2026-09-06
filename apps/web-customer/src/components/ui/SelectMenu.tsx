import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Roughly what a full list wants: enough for ten compact rows. Only used to
 * choose a side — the menu still fits itself to whatever space it lands in. */
const WANTED_HEIGHT = 360

export interface SelectOption<T> {
  value: T
  /** Title inside the menu. */
  label: string
  /** Optional second line — context a native `<option>` could not carry. */
  hint?: string
  /** Optional leading glyph. */
  icon?: ReactNode
}

interface SelectMenuProps<T> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  /** Text on the trigger — usually the selected option, shortened. */
  triggerLabel: string
  triggerIcon?: ReactNode
  /** Full sentence for screen readers, e.g. "Search radius: within 1 km". */
  triggerAriaLabel: string
  /** Names the listbox, e.g. "Search radius". */
  menuLabel: string
  /** Give the trigger the brand treatment while a non-default value is set. */
  highlighted?: boolean
  align?: 'left' | 'right'
  menuWidth?: number
  className?: string
}

/**
 * The filter-row dropdown, shared by every control that sits in one.
 *
 * Custom rather than a native `<select>` because the options carry a second
 * line and an icon, and the trigger has to read as a pill in a dense row
 * instead of platform chrome. Being custom, it owes the keyboard contract a
 * select would have given for free — arrows, Home/End, Enter/Space, Escape,
 * click-outside, and focus returning to the trigger on close. The menu is
 * portalled so the sticky filter bars it sits inside can never clip it.
 */
export function SelectMenu<T>({
  value, options, onChange, triggerLabel, triggerIcon, triggerAriaLabel, menuLabel,
  highlighted = false, align = 'right', menuWidth = 208, className,
}: SelectMenuProps<T>) {
  const m = useAppMotion()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedIndex = Math.max(0, options.findIndex((o) => Object.is(o.value, value)))

  function openMenu() {
    setRect(triggerRef.current?.getBoundingClientRect() ?? null)
    setActive(selectedIndex)
    setOpen(true)
  }

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function commit(i: number) {
    onChange(options[i].value)
    close()
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false)
    }
    // A scroll would leave the portalled menu floating away from its trigger —
    // but the menu scrolls itself once the list is long, and that must not
    // count as the page moving out from under it.
    const onScroll = (e: Event) => {
      const t = e.target as Node | null
      if (t && menuRef.current?.contains(t)) return
      close(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  // Keyboard travel must not walk the highlight off the visible slice of a
  // list that had to scroll.
  useEffect(() => {
    if (!open) return
    const row = menuRef.current?.children[active] as HTMLElement | undefined
    row?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(active) }
    else if (e.key === 'Tab') close(false)
  }

  /** Anchored to one edge of the trigger, clamped so it never runs off a
   * narrow screen. */
  function menuLeft(r: DOMRect): number {
    const raw = align === 'right' ? r.right - menuWidth : r.left
    return Math.max(8, Math.min(raw, window.innerWidth - menuWidth - 8))
  }

  /**
   * Open downwards unless that would squeeze the list, then flip above the
   * trigger. Either way the menu is allowed the whole of the side it lands
   * on, so a full option list is visible rather than silently cropped by a
   * fixed max-height — that crop is what made a ten-option filter look like
   * a seven-option one.
   */
  function placement(r: DOMRect) {
    const gap = 8
    const edge = 12
    const below = window.innerHeight - r.bottom - gap - edge
    const above = r.top - gap - edge
    const flip = below < Math.min(WANTED_HEIGHT, above)
    return { flip, maxHeight: Math.max(176, Math.round(flip ? above : below)) }
  }

  const place = rect ? placement(rect) : null

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-pill border py-2 pl-3 pr-2.5',
          'text-xs font-bold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
          highlighted ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-black/10 bg-white text-ink',
          open ? 'border-brand-300 ring-2 ring-brand-200' : 'hover:border-brand-200',
        )}
      >
        {triggerIcon}
        <span className="max-w-[7.5rem] truncate tabular-nums">{triggerLabel}</span>
        <motion.span
          animate={m.reduced ? undefined : { rotate: open ? 180 : 0 }}
          transition={m.transition}
          className={highlighted ? 'text-brand-500' : 'text-ink-faint'}
        >
          <ChevronDown size={14} aria-hidden />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              ref={menuRef}
              role="listbox"
              id={`${id}-listbox`}
              aria-label={menuLabel}
              aria-activedescendant={`${id}-opt-${active}`}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: place?.flip ? 6 : -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={m.reduced ? { opacity: 0 } : { opacity: 0, y: place?.flip ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: place?.flip ? 'auto' : rect.bottom + 8,
                bottom: place?.flip ? window.innerHeight - rect.top + 8 : 'auto',
                left: menuLeft(rect),
                width: menuWidth,
                maxHeight: place?.maxHeight,
              }}
              className="menu-scroll z-[60] overflow-y-auto rounded-2xl border border-black/5 bg-white p-1 shadow-lift"
            >
              {options.map((opt, i) => {
                const isSelected = Object.is(opt.value, value)
                return (
                  <button
                    key={String(opt.value)}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => commit(i)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-2.5 text-left transition-colors',
                      opt.hint ? 'py-2' : 'py-1.5',
                      i === active && !isSelected && 'bg-canvas',
                      isSelected && 'bg-brand-50',
                    )}
                  >
                    {opt.icon}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-[13px] font-bold tabular-nums',
                          isSelected ? 'text-brand-700' : 'text-ink',
                        )}
                      >
                        {opt.label}
                      </span>
                      {opt.hint && <span className="block text-[11px] text-ink-faint">{opt.hint}</span>}
                    </span>
                    {isSelected && <Check size={15} className="shrink-0 text-brand-600" aria-hidden />}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
