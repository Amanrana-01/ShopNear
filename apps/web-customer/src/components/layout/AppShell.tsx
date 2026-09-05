import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { CartBar } from './CartBar'

/** Mobile-first, centred on wider viewports — the app is designed at
 * 390 px and simply floats in a phone-width column on desktop rather than
 * re-flowing, which is the honest thing to do for a "walk to the shop"
 * product that will always primarily be used on a phone. */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-[#F7F5FB] sm:shadow-2xl">
      <div className="flex-1 pb-24">
        <Outlet />
      </div>
      <CartBar />
      <BottomNav />
    </div>
  )
}
