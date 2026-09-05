import { Router, type Request } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { verifyAccessToken } from '../auth/auth.service'
import { searchQuerySchema, multiSearchBodySchema, type SearchQueryInput, type MultiSearchBodyInput } from './search.schemas'
import { searchProducts } from './search.service'
import { multiItemSearch } from './multiSearch.service'

export const searchRouter = Router()

/**
 * Search works for anonymous browsing too, but a logged-in customer's
 * search still gets attributed on `SearchLog` for the unmet-demand report.
 * Deliberately silent on a missing/invalid token — this endpoint has no
 * `requireAuth`, so an invalid token here should behave like no token, not
 * like an error.
 */
export function optionalUserId(req: Request): string | undefined {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return undefined
  try {
    return verifyAccessToken(header.slice('Bearer '.length)).sub
  } catch {
    return undefined
  }
}

searchRouter.get(
  '/',
  validate({ query: searchQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = (req as ValidatedRequest<unknown, SearchQueryInput>).validated.query
    const result = await searchProducts(query, optionalUserId(req))
    res.json(result)
  }),
)

searchRouter.post(
  '/multi',
  validate({ body: multiSearchBodySchema }),
  asyncHandler(async (req, res) => {
    const body = (req as ValidatedRequest<MultiSearchBodyInput>).validated.body
    const result = await multiItemSearch(body, optionalUserId(req))
    res.json(result)
  }),
)
