import type { NextFunction, Request, Response } from 'express'

/**
 * Wraps an async route/middleware so a rejected promise reaches Express's
 * error-handling pipeline (`next(err)`) instead of becoming an unhandled
 * rejection. Express 5 does this automatically for handlers that return a
 * promise, but wrapping explicitly keeps every route's intent obvious and
 * works regardless of Express version.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Req, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}
