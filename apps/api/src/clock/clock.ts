import { prisma } from '../db'

/**
 * The virtual clock (spec R2). Every piece of business logic that needs
 * "now" — confidence badges, the decay job, reservation expiry — must call
 * `now()` here instead of `new Date()`/`Date.now()`, so that Phase 6's
 * time-travel demo panel can move the whole system's sense of time forward
 * retroactively, and so the offset survives an API restart (it lives in the
 * `AppSetting` table, not a process-local variable).
 *
 * `now()` itself stays synchronous — it is called on essentially every
 * request, and awaiting a DB round trip there would be wasteful. Instead we
 * keep an in-memory cache of the offset that is written through on every
 * mutation (`advanceHours`, `reset`) and can be explicitly rehydrated from
 * the persisted row via `getOffsetMs()` (call this once at process startup,
 * and whenever a test needs to prove the offset is not just module state).
 */
const OFFSET_KEY = 'clock.offsetMs'

let cachedOffsetMs = 0

export function now(): Date {
  return new Date(Date.now() + cachedOffsetMs)
}

/** Reads the persisted offset from `AppSetting`, hydrating the in-memory cache. */
export async function getOffsetMs(): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key: OFFSET_KEY } })
  const value = row?.value
  cachedOffsetMs = typeof value === 'number' ? value : 0
  return cachedOffsetMs
}

async function persistOffsetMs(offsetMs: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: OFFSET_KEY },
    create: { key: OFFSET_KEY, value: offsetMs },
    update: { value: offsetMs },
  })
  cachedOffsetMs = offsetMs
}

/** Moves the clock forward by `hours`, accumulating with any prior offset. */
export async function advanceHours(hours: number): Promise<void> {
  const currentOffsetMs = await getOffsetMs()
  await persistOffsetMs(currentOffsetMs + hours * 60 * 60 * 1000)
}

/** Returns the virtual clock to real time. */
export async function reset(): Promise<void> {
  await persistOffsetMs(0)
}
