import { z } from 'zod'
import { SHOP_TYPES, AVAILABILITY_STATES } from '@shopnear/shared'

/**
 * Zod contracts for the shops endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/shops.ts`, but another agent owns
 * `packages/shared/` and `apps/web-customer/` right now — see
 * `apps/api/src/modules/auth/auth.schemas.ts` for the same note. These live
 * under `apps/api/src/modules/shops/` instead, matching that precedent.
 */

const latSchema = z.coerce.number().gte(-90).lte(90)
const lngSchema = z.coerce.number().gte(-180).lte(180)

// Deliberately NOT restricted to ALLOWED_SEARCH_RADII_M: that list is a UI
// affordance (the customer's radius picker), but the "shop next door" story
// in the seed data and its tests reasons about arbitrary distances (e.g.
// 150 m) that aren't one of those four presets. The API accepts any sane
// positive radius and lets the client pick from its own preset list.
const radiusSchema = z.coerce.number().positive().max(5000).default(1000)

export const nearbyQuerySchema = z.object({
  lat: latSchema,
  lng: lngSchema,
  radius: radiusSchema,
  type: z.enum(SHOP_TYPES).optional(),
})
export type NearbyQueryInput = z.infer<typeof nearbyQuerySchema>

export const shopIdParamSchema = z.object({
  id: z.string().min(1),
})
export type ShopIdParamInput = z.infer<typeof shopIdParamSchema>

export const copyFromParamSchema = z.object({
  id: z.string().min(1),
  otherShopId: z.string().min(1),
})
export type CopyFromParamInput = z.infer<typeof copyFromParamSchema>

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
}).nullable()

export const openingHoursSchema = z.object({
  mon: dayHoursSchema.optional(),
  tue: dayHoursSchema.optional(),
  wed: dayHoursSchema.optional(),
  thu: dayHoursSchema.optional(),
  fri: dayHoursSchema.optional(),
  sat: dayHoursSchema.optional(),
  sun: dayHoursSchema.optional(),
  isTemporarilyClosed: z.boolean().optional(),
})

export const shopPatchSchema = z.object({
  name: z.string().min(1).optional(),
  nameGu: z.string().min(1).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(1).optional(),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
  openingHours: openingHoursSchema.optional(),
  acceptsDelivery: z.boolean().optional(),
  deliveryRadiusMeters: z.coerce.number().int().nonnegative().optional(),
  minOrderValue: z.coerce.number().nonnegative().optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  bannerImageUrl: z.string().optional(),
})
export type ShopPatchInput = z.infer<typeof shopPatchSchema>

export const inventoryQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>

export const inventoryItemSchema = z.object({
  productId: z.string().min(1),
  price: z.coerce.number().positive(),
  availability: z.enum(AVAILABILITY_STATES).optional(),
  notes: z.string().optional(),
})

export const inventoryPutSchema = z.object({
  items: z.array(inventoryItemSchema).min(1),
})
export type InventoryPutInput = z.infer<typeof inventoryPutSchema>
