import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { prisma } from '../db'
import * as clock from './clock'

/**
 * The virtual clock is the foundation everything else in Phase 2 depends on
 * (spec R2). It must be persisted — not module state — so that time-travel
 * survives an API restart, and so a fresh import in another process (or in
 * these tests, a fresh `import()` after `vi.resetModules()`) observes the
 * same offset.
 */
describe('clock', () => {
  beforeEach(async () => {
    // Isolate each test from whatever the previous one left behind.
    await prisma.appSetting.deleteMany({ where: { key: 'clock.offsetMs' } })
    await clock.reset()
  })

  afterAll(async () => {
    await prisma.appSetting.deleteMany({ where: { key: 'clock.offsetMs' } })
    await prisma.$disconnect()
  })

  it('now() with zero offset is within 2s of real time', () => {
    const diff = Math.abs(clock.now().getTime() - Date.now())
    expect(diff).toBeLessThan(2000)
  })

  it('advanceHours(30) moves now() ~30h ahead of real time', async () => {
    await clock.advanceHours(30)
    const diffHours = (clock.now().getTime() - Date.now()) / (1000 * 60 * 60)
    expect(diffHours).toBeGreaterThan(29.9)
    expect(diffHours).toBeLessThan(30.1)
  })

  it('advanceHours accumulates: two calls of 5h leave a 10h offset', async () => {
    await clock.advanceHours(5)
    await clock.advanceHours(5)
    const offsetMs = await clock.getOffsetMs()
    expect(offsetMs).toBeCloseTo(10 * 60 * 60 * 1000, -2)
  })

  it('reset() returns now() to real time', async () => {
    await clock.advanceHours(30)
    await clock.reset()
    const diff = Math.abs(clock.now().getTime() - Date.now())
    expect(diff).toBeLessThan(2000)
  })

  it('the offset survives a fresh import (persisted in AppSetting, not module state)', async () => {
    await clock.advanceHours(12)

    // Simulate a fresh process picking the clock module back up: reset the
    // module registry and re-import, then hydrate from the persisted row.
    vi.resetModules()
    const fresh = await import('./clock')
    const offsetMs = await fresh.getOffsetMs()
    expect(offsetMs).toBeCloseTo(12 * 60 * 60 * 1000, -2)
  })
})
