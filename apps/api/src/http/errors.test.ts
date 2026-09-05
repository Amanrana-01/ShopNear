import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { AppError, badRequest, notFound, errorMiddleware } from './errors'

function buildApp() {
  const app = express()
  app.get('/known', (_req, _res, next) => next(badRequest('Bad field.', [{ path: 'phone', message: 'Required' }])))
  app.get('/unknown', () => {
    throw new Error('boom — this stack must never reach the client')
  })
  app.use(errorMiddleware)
  return app
}

describe('AppError + errorMiddleware', () => {
  it('renders a thrown AppError with its own status and code', async () => {
    const res = await request(buildApp()).get('/known')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Bad field.', details: [{ path: 'phone', message: 'Required' }] },
    })
  })

  it('renders an unexpected error as a 500 INTERNAL_ERROR with no stack in the body', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await request(buildApp()).get('/unknown')
    spy.mockRestore()

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(.*:\d+:\d+\)/) // no stack frame lines
    expect(JSON.stringify(res.body)).not.toContain('boom')
  })

  it('notFound() builds a 404 AppError', () => {
    const err = notFound('Gone.')
    expect(err).toBeInstanceOf(AppError)
    expect(err.httpStatus).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })
})
