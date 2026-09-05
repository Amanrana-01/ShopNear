import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { prisma } from './db'

/**
 * Every error the API returns uses one envelope, so all three clients can
 * parse failures the same way (spec §13).
 */
export interface ApiError {
  error: { code: string; message: string; details?: unknown }
}

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

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' },
    } satisfies ApiError)
  })

  return app
}
