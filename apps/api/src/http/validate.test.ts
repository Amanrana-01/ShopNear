import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { z } from 'zod'
import { validate, type ValidatedRequest } from './validate'
import { errorMiddleware } from './errors'

const bodySchema = z.object({ name: z.string().min(1), age: z.coerce.number().int() })
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) })

function buildApp() {
  const app = express()
  app.use(express.json())
  app.post(
    '/thing',
    validate({ body: bodySchema, query: querySchema }),
    (req, res) => {
      const { body, query } = (req as ValidatedRequest).validated
      res.json({ body, query })
    },
  )
  app.use(errorMiddleware)
  return app
}

describe('validate middleware', () => {
  it('rejects a bad body with 400 and per-field details', async () => {
    const res = await request(buildApp()).post('/thing').send({ age: 'not-a-number' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(Array.isArray(res.body.error.details)).toBe(true)
    expect(res.body.error.details.some((d: { path: string }) => d.path === 'name')).toBe(true)
  })

  it('lets a valid body through, coerced, on req.validated', async () => {
    const res = await request(buildApp())
      .post('/thing?page=2')
      .send({ name: 'Atta', age: '30' })
    expect(res.status).toBe(200)
    expect(res.body.body).toEqual({ name: 'Atta', age: 30 })
    expect(res.body.query).toEqual({ page: 2 })
  })

  it('applies query schema defaults when the field is absent', async () => {
    const res = await request(buildApp()).post('/thing').send({ name: 'Atta', age: 30 })
    expect(res.body.query).toEqual({ page: 1 })
  })
})
