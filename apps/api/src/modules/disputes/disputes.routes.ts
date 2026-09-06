import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../http/authMiddleware'
import {
  createDisputeSchema,
  orderIdParamSchema,
  disputeIdParamSchema,
  listDisputesQuerySchema,
  resolveDisputeSchema,
  type CreateDisputeInput,
  type OrderIdParamInput,
  type DisputeIdParamInput,
  type ListDisputesQueryInput,
  type ResolveDisputeInput,
} from './disputes.schemas'
import { createDispute, listDisputes, resolveDispute } from './disputes.service'

export const disputesRouter = Router()

disputesRouter.post(
  '/orders/:orderId/disputes',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ params: orderIdParamSchema, body: createDisputeSchema }),
  asyncHandler(async (req, res) => {
    const { orderId } = (req as ValidatedRequest<CreateDisputeInput, unknown, OrderIdParamInput>).validated.params
    const body = (req as ValidatedRequest<CreateDisputeInput, unknown, OrderIdParamInput>).validated.body
    const { sub: customerId } = (req as AuthenticatedRequest).auth
    const dispute = await createDispute(customerId, orderId, body)
    res.status(201).json({ dispute })
  }),
)

disputesRouter.get(
  '/admin/disputes',
  requireAuth,
  requireRole('ADMIN'),
  validate({ query: listDisputesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { status } = (req as ValidatedRequest<unknown, ListDisputesQueryInput>).validated.query
    const disputes = await listDisputes(status)
    res.json({ disputes })
  }),
)

disputesRouter.post(
  '/admin/disputes/:id/resolve',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: disputeIdParamSchema, body: resolveDisputeSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<ResolveDisputeInput, unknown, DisputeIdParamInput>).validated.params
    const body = (req as ValidatedRequest<ResolveDisputeInput, unknown, DisputeIdParamInput>).validated.body
    const dispute = await resolveDispute(id, body)
    res.json({ dispute })
  }),
)
