import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { UserRole } from '@shopnear/shared'
import { prisma } from '../db'
import { verifyAccessToken } from '../modules/auth/auth.service'
import type { TokenPayload } from '../modules/auth/auth.types'
import { forbidden, notFound, unauthorized } from './errors'
import { asyncHandler } from './asyncHandler'

export interface AuthenticatedRequest extends Request {
  auth: TokenPayload
}

/**
 * Authenticates the bearer access token and attaches `{ sub, role }` to
 * `req.auth`. This is the *only* check performed here — it says nothing
 * about whether the caller is allowed to do what they're asking, only who
 * they are. Role and ownership are deliberately separate middlewares below
 * (spec §5): a `CUSTOMER` token must 403, never redirect and never 401,
 * when it hits a merchant-only route.
 */
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing bearer token.'))
  }

  const token = header.slice('Bearer '.length)
  try {
    const payload = verifyAccessToken(token)
    ;(req as AuthenticatedRequest).auth = payload
    next()
  } catch {
    next(unauthorized('Invalid or expired access token.'))
  }
}

/**
 * Role check only. Must run after `requireAuth`. Rejects with 403 — never
 * a redirect, never a 401 — so a `CUSTOMER` token hitting a merchant route
 * gets an unambiguous "you're not allowed", not "you're not logged in".
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = (req as AuthenticatedRequest).auth
    if (!auth) return next(unauthorized('Missing bearer token.'))
    if (!roles.includes(auth.role)) {
      return next(forbidden(`This action requires role: ${roles.join(' or ')}.`))
    }
    next()
  }
}

/**
 * Ownership check, deliberately independent of `requireRole`: a MERCHANT
 * token is real and has the right role, but may still be the *wrong*
 * merchant. Loads the shop named by the route param and compares its
 * `ownerId` to the token's subject. Must run after both `requireAuth` and
 * `requireRole('MERCHANT')`.
 */
export function requireShopOwnership(paramName: string): RequestHandler {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const auth = (req as AuthenticatedRequest).auth
    const shopId = req.params[paramName]
    if (!shopId) return next(notFound('Shop not found.'))

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return next(notFound('Shop not found.'))
    if (shop.ownerId !== auth.sub) {
      return next(forbidden('You do not own this shop.'))
    }
    next()
  })
}

/**
 * Same idea as `requireShopOwnership`, but for routes addressed by order id
 * rather than shop id (every merchant order action: confirm, reject,
 * out-for-delivery, complete). Loads the order's shop and compares its
 * `ownerId` to the token's subject — merchant B must never be able to act on
 * merchant A's order, and a merchant who owns two shops must still only
 * touch orders belonging to shops they actually own (spec: never assume one
 * shop per merchant).
 */
export function requireOrderShopOwnership(paramName: string): RequestHandler {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const auth = (req as AuthenticatedRequest).auth
    const orderId = req.params[paramName]
    if (!orderId) return next(notFound('Order not found.'))

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shop: true } })
    if (!order) return next(notFound('Order not found.'))
    if (order.shop.ownerId !== auth.sub) {
      return next(forbidden('You do not own the shop this order belongs to.'))
    }
    next()
  })
}
