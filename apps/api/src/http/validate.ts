import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodError, ZodTypeAny } from 'zod'
import { badRequest } from './errors'

export interface ValidatedRequest<
  Body = unknown,
  Query = unknown,
  Params = unknown,
> extends Request {
  validated: { body: Body; query: Query; params: Params }
}

interface Schemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

function issueDetails(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

/**
 * Validates `req.body` / `req.query` / `req.params` against Zod schemas and
 * exposes the parsed (and coerced) result on `req.validated`, rather than
 * reassigning `req.query`/`req.params` — Express 5 defines both as
 * getter-only accessors on the request prototype, so overwriting them
 * throws under ESM's strict mode. `req.body` is a plain writable property,
 * but we route it through `req.validated` too for one consistent read path
 * in route handlers.
 *
 * On failure, throws a 400 `AppError` (via the error middleware) carrying
 * one `{ path, message }` entry per invalid field.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validated: { body?: unknown; query?: unknown; params?: unknown } = {}

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body)
      if (!result.success) return next(badRequest('Validation failed.', issueDetails(result.error)))
      validated.body = result.data
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query)
      if (!result.success) return next(badRequest('Validation failed.', issueDetails(result.error)))
      validated.query = result.data
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params)
      if (!result.success) return next(badRequest('Validation failed.', issueDetails(result.error)))
      validated.params = result.data
    }

    ;(req as ValidatedRequest).validated = validated as ValidatedRequest['validated']
    next()
  }
}
