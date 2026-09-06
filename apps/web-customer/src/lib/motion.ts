import { useReducedMotion } from 'motion/react'
import type { Transition, Variants } from 'motion/react'

/**
 * One motion vocabulary for the whole app.
 *
 * Three timings, each with a job — a single duration applied to everything is
 * what makes an interface feel "animated" rather than responsive:
 *
 *   snap    — direct manipulation (tap, stepper, chip). Spring, ~180ms felt.
 *   glide   — content arriving or leaving (cards, rails, sheets). ~280ms.
 *   settle  — large surfaces (page transitions, drawers). ~380ms.
 *
 * Exits are consistently faster than entrances: leaving should never make the
 * user wait for the thing they just dismissed.
 */

export const snap: Transition = { type: 'spring', stiffness: 520, damping: 32, mass: 0.7 }
export const glide: Transition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
export const settle: Transition = { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
export const exit: Transition = { duration: 0.16, ease: [0.4, 0, 1, 1] }

/** Per-item entrance used by every grid and rail. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: glide },
}

/** Parent of `itemVariants`. Stagger is capped by `delayChildren` staying at 0
 * so a 40-tile grid never takes two seconds to finish arriving. */
export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: glide },
}

/** Route-level transition. Deliberately subtle — a shopping app is a place
 * you move through quickly, so pages cross-fade rather than slide. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: settle },
  leave: { opacity: 0, y: -6, transition: exit },
}

export const sheetVariants: Variants = {
  hidden: { y: '100%' },
  show: { y: 0, transition: settle },
  leave: { y: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
}

export const scrimVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: glide },
  leave: { opacity: 0, transition: exit },
}

/**
 * Reduced-motion gate.
 *
 * Returns the variants unchanged normally, and a no-op set when the user has
 * asked for reduced motion — content still appears, it just does not travel.
 * Every animated surface in the app goes through this rather than checking the
 * media query itself.
 */
export function useAppMotion() {
  const reduced = useReducedMotion()

  function variants(v: Variants): Variants {
    if (!reduced) return v
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.15 } },
      leave: { opacity: 0, transition: { duration: 0.1 } },
    }
  }

  return {
    reduced,
    variants,
    /** Tap feedback: scale on press, skipped entirely under reduced motion. */
    tap: reduced ? undefined : { scale: 0.95 },
    hover: reduced ? undefined : { y: -2 },
    transition: reduced ? { duration: 0.15 } : snap,
  }
}
