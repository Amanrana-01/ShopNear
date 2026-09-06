import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from './db'

describe('database connectivity', () => {
  afterAll(async () => { await prisma.$disconnect() })

  it('connects to Postgres', async () => {
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`
    expect(rows[0].ok).toBe(1)
  })

  it('has the PostGIS extension available', async () => {
    const rows = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'postgis'
    `
    expect(rows).toHaveLength(1)
  })

  it('has the pg_trgm extension available', async () => {
    const rows = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'
    `
    expect(rows).toHaveLength(1)
  })

  it('can compute a geography distance', async () => {
    // Navrangpura anchor to a point ~1 km east; assert PostGIS maths works
    // end to end before any of our own geography columns exist.
    const rows = await prisma.$queryRaw<{ metres: number }[]>`
      SELECT ST_Distance(
        ST_MakePoint(72.5611, 23.0365)::geography,
        ST_MakePoint(72.5709, 23.0365)::geography
      ) AS metres
    `
    expect(rows[0].metres).toBeGreaterThan(900)
    expect(rows[0].metres).toBeLessThan(1100)
  })
})
