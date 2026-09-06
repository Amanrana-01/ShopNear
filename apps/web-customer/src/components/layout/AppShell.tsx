import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BottomNav } from './BottomNav'
import { CartBar } from './CartBar'
import { DesktopHeader } from './DesktopHeader'
import { SiteFooter } from './SiteFooter'
import { useAppMotion, pageVariants } from '@/lib/motion'

/**
 * Two layouts, one shell.
 *
 * Up to `lg` this is a phone: a centred column with a sticky coloured header
 * per page, a floating cart bar, and a bottom tab bar — the shape of the
 * product people will actually use while walking to a shop.
 *
 * From `lg` it becomes a web app: a persistent header carries location,
 * search, cart and navigation, the tab bar and floating bar retire, and pages
 * spread into a wide container so the dense grids get the columns they were
 * designed for.
 *
 * Route changes cross-fade with `mode="wait"`: the outgoing page leaves in
 * 160ms before the next mounts, so the two never stack in normal flow and
 * double the page height mid-transition.
 */
export function AppShell() {
  const location = useLocation()
  const m = useAppMotion()

  // Each route is a fresh screen, not a continuation — land at the top of it.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <DesktopHeader />

      <div className="mx-auto w-full max-w-lg flex-1 pb-6 lg:max-w-app lg:px-6 lg:pb-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            variants={m.variants(pageVariants)}
            initial="hidden"
            animate="show"
            exit="leave"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <SiteFooter />

      <CartBar />
      <BottomNav />
    </div>
  )
}
