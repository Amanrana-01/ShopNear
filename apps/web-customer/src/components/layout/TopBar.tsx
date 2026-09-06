import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, MapPin, Zap } from 'lucide-react'
import { useLocation } from '@/state/LocationContext'
import { LocationSheet } from '@/components/LocationSheet'
import { SearchBox } from '@/components/SearchBox'
import { useAppMotion } from '@/lib/motion'

/**
 * Mobile header. Two lines, in the order a hyperlocal shopper needs them:
 * *where am I* (everything downstream depends on distance), then *what am I
 * looking for*. The delivery-window pill is the promise the whole product
 * makes, so it sits on the same line as the location rather than buried.
 *
 * Hidden from `lg` up, where DesktopHeader takes over.
 */
export function TopBar() {
  const { location } = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const m = useAppMotion()

  return (
    <header className="sticky top-0 z-30 bg-brand-700 pb-3 pt-[calc(0.65rem+env(safe-area-inset-top))] shadow-soft lg:hidden">
      <div className="mx-auto flex max-w-lg flex-col gap-2.5 px-4">
        <div className="flex items-start justify-between gap-3">
          <motion.button
            type="button"
            onClick={() => setSheetOpen(true)}
            whileTap={m.tap}
            transition={m.transition}
            className="-ml-1 flex min-w-0 items-start gap-1.5 rounded-xl px-1 py-0.5 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <MapPin size={17} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[15px] font-bold leading-tight">
                  {location?.label ?? 'Choose location'}
                </span>
                <ChevronDown size={15} className="shrink-0 opacity-80" aria-hidden />
              </span>
              {location?.sublabel && (
                <span className="mt-0.5 block truncate text-2xs text-white/70">{location.sublabel}</span>
              )}
            </span>
          </motion.button>

          <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 text-2xs font-bold text-white">
            <Zap size={12} className="fill-current" aria-hidden />
            10–20 min
          </span>
        </div>

        <SearchBox />
      </div>
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </header>
  )
}
