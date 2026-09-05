/**
 * The project-wide seed. Changing it reshuffles the entire demo dataset,
 * so keep it fixed — the demo script in /docs refers to specific shops.
 */
export const SEED = 20260905

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  sample<T>(arr: readonly T[], n: number): T[]
  bool(probability: number): boolean
}

/**
 * mulberry32 — a small, fast, seedable PRNG. Deterministic across Node
 * versions and platforms, which is what makes `db:reset` reproducible.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const float = (min: number, max: number) => min + next() * (max - min)
  const int = (min: number, max: number) => Math.floor(float(min, max + 1))

  return {
    next,
    float,
    int,
    pick: <T,>(arr: readonly T[]): T => arr[int(0, arr.length - 1)],
    sample<T>(arr: readonly T[], n: number): T[] {
      // Fisher-Yates on a copy, then take the first n.
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy.slice(0, Math.min(n, copy.length))
    },
    bool: (probability: number) => next() < probability,
  }
}
