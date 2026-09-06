import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../http/authMiddleware'
import {
  createReviewSchema,
  orderIdParamSchema,
  shopIdParamSchema,
  type CreateReviewInput,
  type OrderIdParamInput,
  type ShopIdParamInput,
} from './reviews.schemas'
import { createReview, listShopReviews } from './reviews.service'

export const reviewsRouter = Router()

reviewsRouter.post(
  '/orders/:orderId/reviews',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ params: orderIdParamSchema, body: createReviewSchema }),
  asyncHandler(async (req, res) => {
    const { orderId } = (req as ValidatedRequest<CreateReviewInput, unknown, OrderIdParamInput>).validated.params
    const body = (req as ValidatedRequest<CreateReviewInput, unknown, OrderIdParamInput>).validated.body
    const { sub: customerId } = (req as AuthenticatedRequest).auth
    const review = await createReview(customerId, orderId, body)
    res.status(201).json({ review })
  }),
)

reviewsRouter.get(
  '/shops/:shopId/reviews',
  validate({ params: shopIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { shopId } = (req as ValidatedRequest<unknown, unknown, ShopIdParamInput>).validated.params
    const reviews = await listShopReviews(shopId)
    res.json({ reviews })
  }),
)
