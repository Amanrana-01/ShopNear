import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { prisma } from './db'
import { errorMiddleware } from './http/errors'
import { authRouter } from './modules/auth/auth.routes'
import { shopsRouter } from './modules/shops/shops.routes'

/**
 * Every error the API returns uses one envelope, so all three clients can
 * parse failures the same way (spec §13).
 */
export interface ApiError {
  error: { code: string; message: string; details?: unknown }
}

/**
 * Auth routes are the obvious brute-force target (OTP guesses, password
 * guesses) — rate-limited per spec §13. Generous enough that the test
 * suite and a normal demo session never trip it, tight enough to be a real
 * control.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
})

export function createApp(): Express {
  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const rows = await prisma.$queryRaw<{ version: string }[]>`
        SELECT extversion AS version FROM pg_extension WHERE extname = 'postgis'
      `
      res.json({
        status: 'ok',
        database: 'connected',
        postgis: rows[0]?.version ?? 'missing',
        timestamp: new Date().toISOString(),
      })
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Cannot reach the database.' },
      } satisfies ApiError)
    }
  })

  const apiRouter = express.Router()
  apiRouter.use('/auth', authRateLimiter, authRouter)
  apiRouter.use('/shops', shopsRouter)
  app.use('/api', apiRouter)

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' },
    } satisfies ApiError)
  })

  // Must be mounted last so errors thrown/forwarded by any route above reach it.
  app.use(errorMiddleware)

  return app
}
