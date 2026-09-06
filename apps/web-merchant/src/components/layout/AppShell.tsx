import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

/** Mobile-first, centred on wider viewports — designed at 390 px, floats in
 * a phone-width column on desktop rather than re-flowing (matches
 * web-customer's convention; the two apps read as siblings). */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-[#F7F5FB] sm:shadow-2xl">
      <TopBar />
      <div className="flex-1 pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
