import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { bannerPhoto, BANNER_PHOTOS } from '@/lib/photos'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Slide {
  id: keyof typeof BANNER_PHOTOS
  title: string
  body: string
  to: string
  cta: string
  /** Ground colour behind the photo; the photo fades into it from the left so
   * the headline always sits on flat colour and stays legible. */
  ground: string
}

/**
 * Home hero carousel — a photograph with the copy set over a solid ground on
 * the left, the layout every quick-commerce home page opens with.
 *
 * Every slide points at something the app can actually do — the multi-item
 * list search, the reservation flow, the price comparison — rather than being
 * decorative filler. Auto-advance pauses on hover/focus and stops entirely
 * under reduced motion, where the slides become a manual set.
 */
const SLIDES: Slide[] = [
  {
    id: 'list',
    title: 'One list. One shop.',
    body: 'Type “atta, doodh, Maggi, sabun” and we’ll find the single shop nearby that has all of it.',
    to: '/multi-search',
    cta: 'Try list search',
    ground: '#1F6F4A',
  },
  {
    id: 'reserve',
    title: 'Held for two hours.',
    body: 'Reserve at the counter, walk over, pay in person. No prepayment, no delivery wait.',
    to: '/search?q=atta',
    cta: 'Find something',
    ground: '#571F85',
  },
  {
    id: 'compare',
    title: 'Compare every shop.',
    body: 'The same item priced across every kirana in your radius, with live stock confirmations.',
    to: '/search?category=vegetables',
    cta: 'Browse fresh',
    ground: '#B3491F',
  },
]

const INTERVAL_MS = 5200

export function PromoCarousel({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const m = useAppMotion()

  useEffect(() => {
    if (paused || m.reduced) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, m.reduced])

  const slide = SLIDES[index]

  return (
    <section
      className={cn('px-4 lg:px-0', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Highlights"
    >
      <div className="relative h-[10.5rem] overflow-hidden rounded-card shadow-soft sm:h-[12rem] lg:h-[14rem]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={slide.id}
            initial={m.reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={m.reduced ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            style={{ backgroundColor: slide.ground }}
          >
            <img
              src={bannerPhoto(slide.id, { w: 700, h: 260 })}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-y-0 right-0 h-full w-[62%] object-cover"
            />
            {/* Colour-to-transparent wash so the headline never lands on busy
                photography, whatever the image happens to contain. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${slide.ground} 0%, ${slide.ground} 42%, ${slide.ground}D9 54%, transparent 76%)`,
              }}
            />

            <div className="relative flex h-full max-w-[62%] flex-col justify-center gap-1.5 p-4 sm:max-w-[58%] sm:p-6">
              <h2 className="font-display text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-3xl">
                {slide.title}
              </h2>
              <p className="line-clamp-2 text-[12.5px] leading-snug text-white/85 sm:text-sm">
                {slide.body}
              </p>
              <Link
                to={slide.to}
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-black text-ink shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ ['--tw-ring-offset-color' as string]: slide.ground }}
              >
                {slide.cta}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index}
              className="group p-1 focus-visible:outline-none"
            >
              <span
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-300',
                  'group-focus-visible:ring-2 group-focus-visible:ring-white',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 group-hover:bg-white/80',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
