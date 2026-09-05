import type { NextFunction, Request, Response } from 'express'

/**
 * Every failure the API returns renders the same envelope:
 * `{ error: { code, message, details? } }` (spec §13). Business code throws
 * an `AppError` (or lets one of the helpers below build it); anything else
 * that escapes a route is an unexpected bug and is rendered as a generic
 * 500 with no stack trace in the response body — the stack is logged
 * server-side only.
 */
export class AppError extends Error {
  readonly code: string
  readonly httpStatus: number
  readonly details?: unknown

  constructor(code: string, httpStatus: number, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError('BAD_REQUEST', 400, message, details)
}

export function unauthorized(message = 'Authentication is required.', details?: unknown): AppError {
  return new AppError('UNAUTHORIZED', 401, message, details)
}

export function forbidden(message = 'You do not have permission to do this.', details?: unknown): AppError {
  return new AppError('FORBIDDEN', 403, message, details)
}

export function notFound(message = 'The requested resource was not found.', details?: unknown): AppError {
  return new AppError('NOT_FOUND', 404, message, details)
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError('CONFLICT', 409, message, details)
}

/**
 * Terminal error middleware — must be mounted last, after every route and
 * after `express.json()`. Express recognises an error middleware only by
 * its four-argument arity, so `next` must stay in the signature even though
 * it is unused.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    })
    return
  }

  // Anything else is a bug, not an expected failure. Log the full error
  // (stack included) server-side, but never leak it to the client.
  console.error(err)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  })
}
