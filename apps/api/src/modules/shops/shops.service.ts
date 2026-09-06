import { Prisma, type Availability } from '@prisma/client'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { notFound } from '../../http/errors'
import { computeIsOpenNow, type OpeningHours } from './openingHours'
import type { NearbyQueryInput, ShopPatchInput, InventoryQueryInput, InventoryPutInput } from './shops.schemas'

interface NearbyRow {
  id: string
  name: string
  nameGu: string
  type: string
  description: string | null
  phone: string
  address: string
  lat: number
  lng: number
  status: string
  openingHours: unknown
  acceptsDelivery: boolean
  deliveryRadiusMeters: number
  minOrderValue: number
  deliveryFee: number
  avgRating: number
  ratingCount: number
  bannerImageUrl: string | null
  distanceMeters: number
}

/**
 * Radius search over `Shop.location` — a PostGIS geography column,
 * GIST-indexed (spec §13: search under 300 ms). Deliberately `$queryRaw`
 * with `ST_DWithin`/`ST_Distance`, never Haversine in JS: Prisma has no
 * geography type of its own, and a JS-side distance loop can't use the
 * index at all.
 *
 * Only `ACTIVE` shops are visible here — `PENDING` and `SUSPENDED` shops
 * never appear to a customer browsing nearby.
 */
export async function getNearbyShops(input: NearbyQueryInput) {
  const { lat, lng, radius, type } = input
  const typeFilter = type ? Prisma.sql`AND type = ${type}::"ShopType"` : Prisma.empty

  const rows = await prisma.$queryRaw<NearbyRow[]>(Prisma.sql`
    SELECT id, name, "nameGu", type, description, phone, address, lat, lng, status,
           "openingHours", "acceptsDelivery", "deliveryRadiusMeters", "minOrderValue",
           "deliveryFee", "avgRating", "ratingCount", "bannerImageUrl",
           ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS "distanceMeters"
    FROM "Shop"
    WHERE status = 'ACTIVE'
      AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})
      ${typeFilter}
    ORDER BY "distanceMeters" ASC
  `)

  const now = clock.now()
  return rows.map((row) => ({
    ...row,
    distanceMeters: Math.round(Number(row.distanceMeters)),
    isOpenNow: computeIsOpenNow(row.openingHours as OpeningHours, now),
  }))
}

export async function getShopDetail(id: string) {
  const shop = await prisma.shop.findUnique({ where: { id } })
  if (!shop) throw notFound('Shop not found.')

  const grouped = await prisma.shopInventory.groupBy({
    by: ['availability'],
    where: { shopId: id, isActive: true },
    _count: true,
  })

  const inventorySummary = {
    totalItems: grouped.reduce((sum, g) => sum + g._count, 0),
    byAvailability: Object.fromEntries(grouped.map((g) => [g.availability, g._count])) as Record<string, number>,
  }

  return {
    shop: { ...shop, isOpenNow: computeIsOpenNow(shop.openingHours as OpeningHours, clock.now()) },
    inventorySummary,
  }
}

export async function updateShop(id: string, patch: ShopPatchInput) {
  const { lat, lng, ...rest } = patch

  const shop = await prisma.shop.update({ where: { id }, data: rest })

  // Keep the PostGIS geography column in step with lat/lng — Prisma cannot
  // write an Unsupported() column directly, so this is always a second,
  // raw statement when either coordinate moves.
  if (lat !== undefined || lng !== undefined) {
    const newLat = lat ?? shop.lat
    const newLng = lng ?? shop.lng
    await prisma.$executeRaw`
      UPDATE "Shop" SET lat = ${newLat}, lng = ${newLng},
        location = ST_SetSRID(ST_MakePoint(${newLng}, ${newLat}), 4326)::geography
      WHERE id = ${id}
    `
  }

  return prisma.shop.findUniqueOrThrow({ where: { id } })
}

export async function getShopInventory(shopId: string, opts: InventoryQueryInput) {
  const where: Prisma.ShopInventoryWhereInput = {
    shopId,
    isActive: true,
    ...(opts.query ? { product: { name: { contains: opts.query, mode: 'insensitive' } } } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.shopInventory.findMany({
      where,
      include: { product: true },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      orderBy: { product: { name: 'asc' } },
    }),
    prisma.shopInventory.count({ where }),
  ])

  return { items, total, page: opts.page, pageSize: opts.pageSize }
}

/**
 * Bulk upsert of prices/availability. Every write — even one that only
 * touches price — records an `AvailabilityEvent` (spec Task 5) so the
 * audit trail and the confidence model always have a timestamp to reason
 * from.
 */
export async function putShopInventory(shopId: string, input: InventoryPutInput) {
  const now = clock.now()

  return prisma.$transaction(async (tx) => {
    const results = []
    for (const item of input.items) {
      const existing = await tx.shopInventory.findUnique({
        where: { shopId_productId: { shopId, productId: item.productId } },
      })
      const previousAvailability: Availability = existing?.availability ?? 'UNKNOWN'
      const newAvailability: Availability = item.availability ?? previousAvailability

      const updated = await tx.shopInventory.upsert({
        where: { shopId_productId: { shopId, productId: item.productId } },
        create: {
          shopId,
          productId: item.productId,
          price: item.price,
          availability: newAvailability,
          availabilityUpdatedAt: now,
          availabilitySource: 'MERCHANT_MANUAL',
          notes: item.notes,
        },
        update: {
          price: item.price,
          availability: newAvailability,
          availabilityUpdatedAt: now,
          availabilitySource: 'MERCHANT_MANUAL',
          ...(item.notes !== undefined ? { notes: item.notes } : {}),
        },
      })

      await tx.availabilityEvent.create({
        data: {
          shopId,
          productId: item.productId,
          previousAvailability,
          newAvailability,
          source: 'MERCHANT_MANUAL',
        },
      })

      results.push(updated)
    }
    return results
  })
}

/**
 * Demo onboarding shortcut (spec §9): a new shop copies another shop's
 * inventory wholesale instead of building it item by item. Only fills in
 * products the destination doesn't already carry — never overwrites an
 * existing price the merchant may have already set.
 */
export async function copyInventoryFromShop(shopId: string, otherShopId: string) {
  if (shopId === otherShopId) {
    throw notFound('Cannot copy a shop\'s inventory from itself.')
  }

  const source = await prisma.shop.findUnique({ where: { id: otherShopId } })
  if (!source) throw notFound('Source shop not found.')

  const sourceItems = await prisma.shopInventory.findMany({ where: { shopId: otherShopId, isActive: true } })
  const existingProductIds = new Set(
    (await prisma.shopInventory.findMany({ where: { shopId }, select: { productId: true } })).map((r) => r.productId),
  )

  const now = clock.now()
  const toCopy = sourceItems.filter((item) => !existingProductIds.has(item.productId))

  return prisma.$transaction(async (tx) => {
    const created = []
    for (const item of toCopy) {
      const row = await tx.shopInventory.create({
        data: {
          shopId,
          productId: item.productId,
          price: item.price,
          availability: item.availability,
          availabilityUpdatedAt: now,
          availabilitySource: 'MERCHANT_MANUAL',
        },
      })
      await tx.availabilityEvent.create({
        data: {
          shopId,
          productId: item.productId,
          previousAvailability: 'UNKNOWN',
          newAvailability: item.availability,
          source: 'MERCHANT_MANUAL',
        },
      })
      created.push(row)
    }
    return { copiedCount: created.length }
  })
}
