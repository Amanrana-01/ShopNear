import { z } from 'zod'
import { SHOP_TYPES } from '@shopnear/shared'
import { phoneSchema } from '../auth/auth.schemas'

/**
 * Zod contracts for merchant registration (spec §5, wizard steps 1-7).
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/registration.ts`, but another agent owns
 * `packages/shared/` right now — see `apps/api/src/modules/auth/auth.schemas.ts`
 * for the same note. These live under `apps/api/src/modules/merchants/` instead.
 *
 * Wizard progress itself is client-side (localStorage, spec R9) — this
 * schema describes the single atomic submit on step 7, not per-step saves.
 * There is no DRAFT status and no partial-save endpoint.
 */

const dayHoursSchema = z
  .object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .nullable()

export const registrationOpeningHoursSchema = z.object({
  mon: dayHoursSchema.optional(),
  tue: dayHoursSchema.optional(),
  wed: dayHoursSchema.optional(),
  thu: dayHoursSchema.optional(),
  fri: dayHoursSchema.optional(),
  sat: dayHoursSchema.optional(),
  sun: dayHoursSchema.optional(),
  isTemporarilyClosed: z.boolean().default(false),
})

export const merchantRegistrationSchema = z.object({
  // Step 1: owner details. Language is chosen first so the rest of the
  // wizard can render translated (spec §5) — not this API's concern, but the
  // field still needs to land on the User row.
  owner: z.object({
    name: z.string().min(1),
    phone: phoneSchema,
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    preferredLanguage: z.enum(['en', 'hi', 'gu']).default('en'),
  }),
  // Step 2: shop details.
  shop: z.object({
    name: z.string().min(1),
    nameGu: z.string().min(1),
    type: z.enum(SHOP_TYPES),
    description: z.string().optional(),
    phone: phoneSchema,
  }),
  // Step 3: location.
  location: z.object({
    address: z.string().min(1),
    landmark: z.string().optional(),
    pincode: z.string().min(1),
    lat: z.coerce.number().gte(-90).lte(90),
    lng: z.coerce.number().gte(-180).lte(180),
  }),
  // Step 4: timings.
  openingHours: registrationOpeningHoursSchema,
  // Step 5: fulfilment. Reserve-and-collect is always on; delivery is an
  // opt-in toggle revealing the rest (spec §5 step 5).
  fulfilment: z
    .object({
      acceptsDelivery: z.boolean().default(false),
      deliveryRadiusMeters: z.coerce.number().int().nonnegative().default(0),
      minOrderValue: z.coerce.number().nonnegative().default(0),
      deliveryFee: z.coerce.number().nonnegative().default(0),
    })
    .default({ acceptsDelivery: false, deliveryRadiusMeters: 0, minOrderValue: 0, deliveryFee: 0 }),
  // Step 6: verification documents — format-validated only, never verified
  // (spec R11). Both optional: a merchant may skip this step in the demo.
  verification: z
    .object({
      licenceNumber: z.string().optional(),
      licenceDocUrl: z.string().optional(),
    })
    .optional(),
  // Step 7: starter inventory — the wizard's editable copy of the curated
  // starter-catalogue list (spec R10), sent back with the merchant's chosen
  // prices. At least one item so a newly approved shop is never empty.
  starterItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        price: z.coerce.number().positive(),
      }),
    )
    .min(1, 'Select at least one starter inventory item.'),
})
export type MerchantRegistrationInput = z.infer<typeof merchantRegistrationSchema>

export const starterCatalogueQuerySchema = z.object({
  shopType: z.enum(SHOP_TYPES),
})
export type StarterCatalogueQueryInput = z.infer<typeof starterCatalogueQuerySchema>
