import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { requireAuth, requireRole, requireShopOwnership } from '../../http/authMiddleware'
import {
  nearbyQuerySchema,
  shopIdParamSchema,
  copyFromParamSchema,
  shopPatchSchema,
  inventoryQuerySchema,
  inventoryPutSchema,
  type NearbyQueryInput,
  type ShopIdParamInput,
  type CopyFromParamInput,
  type ShopPatchInput,
  type InventoryQueryInput,
  type InventoryPutInput,
} from './shops.schemas'
import {
  getNearbyShops,
  getShopDetail,
  updateShop,
  getShopInventory,
  putShopInventory,
  copyInventoryFromShop,
} from './shops.service'

export const shopsRouter = Router()

shopsRouter.get(
  '/nearby',
  validate({ query: nearbyQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = (req as ValidatedRequest<unknown, NearbyQueryInput>).validated.query
    const shops = await getNearbyShops(query)
    res.json({ shops })
  }),
)

shopsRouter.get(
  '/:id',
  validate({ params: shopIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<unknown, unknown, ShopIdParamInput>).validated.params
    const result = await getShopDetail(id)
    res.json(result)
  }),
)

shopsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('MERCHANT'),
  requireShopOwnership('id'),
  validate({ params: shopIdParamSchema, body: shopPatchSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<ShopPatchInput, unknown, ShopIdParamInput>).validated.params
    const patch = (req as ValidatedRequest<ShopPatchInput, unknown, ShopIdParamInput>).validated.body
    const shop = await updateShop(id, patch)
    res.json({ shop })
  }),
)

shopsRouter.get(
  '/:id/inventory',
  validate({ params: shopIdParamSchema, query: inventoryQuerySchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<unknown, InventoryQueryInput, ShopIdParamInput>).validated.params
    const query = (req as ValidatedRequest<unknown, InventoryQueryInput, ShopIdParamInput>).validated.query
    const result = await getShopInventory(id, query)
    res.json(result)
  }),
)

shopsRouter.put(
  '/:id/inventory',
  requireAuth,
  requireRole('MERCHANT'),
  requireShopOwnership('id'),
  validate({ params: shopIdParamSchema, body: inventoryPutSchema }),
  asyncHandler(async (req, res) => {
    const { id } = (req as ValidatedRequest<InventoryPutInput, unknown, ShopIdParamInput>).validated.params
    const body = (req as ValidatedRequest<InventoryPutInput, unknown, ShopIdParamInput>).validated.body
    const items = await putShopInventory(id, body)
    res.json({ items })
  }),
)

shopsRouter.post(
  '/:id/inventory/copy-from/:otherShopId',
  requireAuth,
  requireRole('MERCHANT'),
  requireShopOwnership('id'),
  validate({ params: copyFromParamSchema }),
  asyncHandler(async (req, res) => {
    const { id, otherShopId } = (req as ValidatedRequest<unknown, unknown, CopyFromParamInput>).validated.params
    const result = await copyInventoryFromShop(id, otherShopId)
    res.json(result)
  }),
)
