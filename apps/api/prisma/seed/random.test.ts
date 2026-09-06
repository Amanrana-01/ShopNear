import { describe, it, expect } from 'vitest'
import { createRng, SEED } from './random'

describe('deterministic RNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(SEED)
    const b = createRng(SEED)
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = createRng(1)
    const b = createRng(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng(SEED)
    for (let i = 0; i < 500; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int() stays within the inclusive range', () => {
    const rng = createRng(SEED)
    for (let i = 0; i < 500; i++) {
      const v = rng.int(3, 7)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(7)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('sample() returns n distinct elements', () => {
    const rng = createRng(SEED)
    const picked = rng.sample([1, 2, 3, 4, 5, 6, 7, 8], 4)
    expect(picked).toHaveLength(4)
    expect(new Set(picked).size).toBe(4)
  })

  it('sample() never returns more than the source length', () => {
    const rng = createRng(SEED)
    expect(rng.sample([1, 2, 3], 10)).toHaveLength(3)
  })

  it('bool() respects its probability roughly', () => {
    const rng = createRng(SEED)
    let trues = 0
    for (let i = 0; i < 1000; i++) if (rng.bool(0.8)) trues++
    expect(trues).toBeGreaterThan(700)
    expect(trues).toBeLessThan(900)
  })
})
