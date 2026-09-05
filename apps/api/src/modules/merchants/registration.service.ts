import argon2 from 'argon2'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { conflict } from '../../http/errors'
import { signTokens, toPublicUser } from '../auth/auth.service'
import type { MerchantRegistrationInput } from './registration.schemas'
import type { ShopType } from '@shopnear/shared'

/**
 * The seven-step wizard's single atomic submit (spec R9, §5). The server
 * only ever sees this one request — wizard progress lives client-side in
 * localStorage — so everything the wizard collected across all seven steps
 * lands here in one transaction: User (MERCHANT, PENDING password reset
 * never applies to a brand-new account), Shop (status PENDING), an Address
 * row for the owner (kept in step with the shop's own address/lat/lng so the
 * User model's defaultAddressId invariant still holds), and the starter
 * ShopInventory rows from step 7.
 *
 * A PENDING shop can be read/edited by its owner but cannot receive orders —
 * that gate lives in the orders module (spec §5), not here.
 */
export async function registerMerchant(input: MerchantRegistrationInput) {
  const existing = await prisma.user.findUnique({
    where: { phone_role: { phone: input.owner.phone, role: 'MERCHANT' } },
  })
  if (existing) {
    throw conflict('A merchant account with this phone number already exists.')
  }

  const passwordHash = await argon2.hash(input.owner.password)
  const now = clock.now()

  const { userId, shopId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.owner.name,
        phone: input.owner.phone,
        role: 'MERCHANT',
        passwordHash,
        preferredLanguage: input.owner.preferredLanguage,
      },
    })

    const shop = await tx.shop.create({
      data: {
        ownerId: user.id,
        name: input.shop.name,
        nameGu: input.shop.nameGu,
        type: input.shop.type,
        description: input.shop.description,
        phone: input.shop.phone,
        address: input.location.address,
        lat: input.location.lat,
        lng: input.location.lng,
        status: 'PENDING',
        openingHours: input.openingHours,
        acceptsDelivery: input.fulfilment.acceptsDelivery,
        deliveryRadiusMeters: input.fulfilment.deliveryRadiusMeters,
        minOrderValue: input.fulfilment.minOrderValue,
        deliveryFee: input.fulfilment.deliveryFee,
        licenceNumber: input.verification?.licenceNumber,
        licenceDocUrl: input.verification?.licenceDocUrl,
      },
    })

    // Prisma has no geography type of its own — keep `location` in step with
    // lat/lng via a second, raw statement, same pattern as the seed and the
    // shops service.
    await tx.$executeRaw`
      UPDATE "Shop" SET location = ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326)::geography
      WHERE id = ${shop.id}
    `

    const address = await tx.address.create({
      data: {
        userId: user.id,
        label: 'Shop',
        line1: input.location.address,
        landmark: input.location.landmark,
        pincode: input.location.pincode,
        lat: input.location.lat,
        lng: input.location.lng,
      },
    })
    await tx.user.update({ where: { id: user.id }, data: { defaultAddressId: address.id } })

    // Starter inventory (spec R10, step 7). UNKNOWN/SEED — the merchant
    // hasn't confirmed any of it yet, just listed prices; a genuine "have
    // it" confirmation still has to come from the merchant later.
    for (const item of input.starterItems) {
      await tx.shopInventory.create({
        data: {
          shopId: shop.id,
          productId: item.productId,
          price: item.price,
          availability: 'UNKNOWN',
          availabilityUpdatedAt: now,
          availabilitySource: 'SEED',
        },
      })
    }

    return { userId: user.id, shopId: shop.id }
  })

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })
  const tokens = signTokens(user)

  return { user: toPublicUser(user), shop, tokens }
}

/**
 * Wizard step 7's data source: the curated per-shop-type starter list (spec
 * R10), with suggested prices the merchant can edit before submitting.
 */
export async function getStarterCatalogue(shopType: ShopType) {
  const items = await prisma.starterCatalogueItem.findMany({
    where: { shopType },
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  })

  return items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    nameGu: item.product.nameGu,
    unitType: item.product.unitType,
    defaultUnitLabel: item.product.defaultUnitLabel,
    imageUrl: item.product.imageUrl,
    suggestedPrice: item.suggestedPrice,
  }))
}
