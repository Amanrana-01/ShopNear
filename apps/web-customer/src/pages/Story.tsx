import { Link } from 'react-router-dom'
import { LipScrollZoominAnimation } from '@/components/ui/lip-scroll-zoomin-animation'
import { Button } from '@/components/ui/Button'

/**
 * Standalone brand/marketing page. Deliberately mounted outside AppShell and
 * RequireLocation so it scrolls on the window (GSAP ScrollTrigger pins against
 * the window scroller) and is reachable before a location is chosen.
 */
export default function Story() {
  return (
    <div className="min-h-screen w-full bg-white text-black overflow-x-hidden">
      <LipScrollZoominAnimation
        title="SHOP NEAR. SHOP NOW."
        subtitle={
          <>
            EVERY SHELF ON YOUR STREET, <span className="text-brand font-black">LIVE</span>. SHOPNEAR SHOWS WHAT IS{' '}
            <span className="text-brand font-black">ACTUALLY IN STOCK</span> AT THE SHOPS AROUND YOU — REAL PRICES,
            REAL INVENTORY, <span className="text-brand font-black">READY IN MINUTES</span>, NOT DAYS.
          </>
        }
        outroTitle={
          <>
            YOUR NEIGHBOURHOOD, <span className="text-brand font-black">IN STOCK.</span>
          </>
        }
        outroSubtitle={
          <>
            ONE SEARCH ACROSS EVERY SHOP WITHIN YOUR RADIUS.{' '}
            <span className="text-brand font-black">LIVE AVAILABILITY</span>, HONEST PRICING, AND{' '}
            <span className="text-brand font-black">PICKUP OR DELIVERY</span> FROM PEOPLE ON YOUR OWN STREET.
          </>
        }
        watermark="SHOPNEAR"
        posterSrc="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80"
      />

      <section className="w-full bg-white flex flex-col items-center gap-4 px-6 pb-24 text-center">
        <Link to="/home">
          <Button size="lg">Start shopping near you</Button>
        </Link>
        <Link to="/" className="text-sm font-semibold text-brand-700 hover:underline">
          Set my location first
        </Link>
      </section>
    </div>
  )
}
