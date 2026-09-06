import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from './app'
import { prisma } from './db'

describe('health endpoint', () => {
  afterAll(async () => { await prisma.$disconnect() })

  it('reports ok with database connectivity', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.database).toBe('connected')
  })

  it('reports the PostGIS version, proving the extension is live', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.body.postgis).toMatch(/^3\./)
  })

  it('returns a structured error envelope for unknown routes', async () => {
    const res = await request(createApp()).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(typeof res.body.error.message).toBe('string')
  })
})
