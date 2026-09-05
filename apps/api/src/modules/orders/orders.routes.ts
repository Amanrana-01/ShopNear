import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { requireAuth, requireRole, requireShopOwnership, requireOrderShopOwnership, type AuthenticatedRequest } from '../../http/authMiddleware'
import {
  createOrderSchema,
  confirmOrderSchema,
  rejectOrderSchema,
  completeOrderSchema,
  orderIdParamSchema,
  shopIdParamSchema,
  type CreateOrderInput,
  type ConfirmOrderInput,
  type RejectOrderInput,
  type CompleteOrderInput,
  type OrderIdParamInput,
  type ShopIdParamInput,
} from './orders.schemas'
import {
  createOrder,
  getOrder,
  listCustomerOrders,
  listShopOrders,
  confirmOrder,
  rejectOrder,
  markOutForDelivery,
  completeOrder,
  cancelOrder,
} from './orders.service'

export const ordersRouter = Router()

ordersRouter.post(
  '/',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const { sub: customerId } = (req as AuthenticatedRequest).auth
    const body = (req as ValidatedRequest<CreateOrderInput>).validated.body
    const order = await createOrder(customerId, body)
    res.status(201).json({ order })
  }),
)

// Declared ahead of '/:id' — otherwise Express would treat "mine"/"shop" as
// an order id.
ordersRouter.get(
  '/mine',
  requireAuth,
  requireRole('CUSTOMER'),
  asyncHandler(async (req, res) => {
    const { sub: customerId } = (req as AuthenticatedRequest).auth
    const orders = await listCustomerOrders(customerId)
    res.json({ orders })
  }),
)

ordersRouter.get(
  '/shop/:shopId',
  requireAuth,
  requireRole('MERCHANT'),
  requireShopOwnership('shopId'),
  validate({ params: shopIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { shopId } = (req as ValidatedRequest<unknown, unknown, ShopIdParamInput>).validated.params
    const orders = await listShopOrders(shopId)
    res.json({ orders })
  }),
)

ordersRouter.get(
  '/:id',
  requireAuth,
  validate({ params: orderIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<unknown, unknown, OrderIdParamInput>).validated.params
    const auth = (req as AuthenticatedRequest).auth
    const order = await getOrder(id, auth)
    res.json({ order })
  }),
)

ordersRouter.post(
  '/:id/confirm',
  requireAuth,
  requireRole('MERCHANT'),
  requireOrderShopOwnership('id'),
  validate({ params: orderIdParamSchema, body: confirmOrderSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<ConfirmOrderInput, unknown, OrderIdParamInput>).validated.params
    const body = (req as ValidatedRequest<ConfirmOrderInput, unknown, OrderIdParamInput>).validated.body
    const order = await confirmOrder(id, body)
    res.json({ order })
  }),
)

ordersRouter.post(
  '/:id/reject',
  requireAuth,
  requireRole('MERCHANT'),
  requireOrderShopOwnership('id'),
  validate({ params: orderIdParamSchema, body: rejectOrderSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<RejectOrderInput, unknown, OrderIdParamInput>).validated.params
    const { reason } = (req as ValidatedRequest<RejectOrderInput, unknown, OrderIdParamInput>).validated.body
    const order = await rejectOrder(id, reason)
    res.json({ order })
  }),
)

ordersRouter.post(
  '/:id/out-for-delivery',
  requireAuth,
  requireRole('MERCHANT'),
  requireOrderShopOwnership('id'),
  validate({ params: orderIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<unknown, unknown, OrderIdParamInput>).validated.params
    const order = await markOutForDelivery(id)
    res.json({ order })
  }),
)

ordersRouter.post(
  '/:id/complete',
  requireAuth,
  requireRole('MERCHANT'),
  requireOrderShopOwnership('id'),
  validate({ params: orderIdParamSchema, body: completeOrderSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<CompleteOrderInput, unknown, OrderIdParamInput>).validated.params
    const { pickupCode } = (req as ValidatedRequest<CompleteOrderInput, unknown, OrderIdParamInput>).validated.body
    const order = await completeOrder(id, pickupCode)
    res.json({ order })
  }),
)

ordersRouter.post(
  '/:id/cancel',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ params: orderIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<unknown, unknown, OrderIdParamInput>).validated.params
    const { sub: customerId } = (req as AuthenticatedRequest).auth
    const order = await cancelOrder(id, customerId)
    res.json({ order })
  }),
)
