import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import argon2 from 'argon2'
import { prisma } from '../db'
import * as clock from '../clock/clock'
import { getDecayThresholds } from '../config/runtimeConfig'
import { computeBadge } from '../modules/availability/confidence'
import { runDecayJob } from './decay.job'

/**
 * This is the test that matters most for the whole phase (see the task
 * report): advance the virtual clock 30 hours, run the decay job, and prove
 * a specific `ShopInventory` row's badge visibly changed from "In stock" to
 * "Usually available" — and that the change is backed by a written
 * `AUTO_DECAY` `AvailabilityEvent`, not just a read-time illusion.
 *
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables.
 */

const OWNER_PHONE = '9166663001'

let shopId: string
let productInStockId: string
let productOutOfStockId: string
let productFreshId: string

async function cleanup() {
  const owner = await prisma.user.findUnique({ where: { phone_role: { phone: OWNER_PHONE, role: 'MERCHANT' } } })
  if (owner) {
    const shops = await prisma.shop.findMany({ where: { ownerId: owner.id }, select: { id: true } })
    const shopIds = shops.map((s) => s.id)
    if (shopIds.length > 0) {
      await prisma.availabilityEvent.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    }
    await prisma.user.delete({ where: { id: owner.id } })
  }
  await prisma.product.deleteMany({ where: { name: { startsWith: 'Fixture Decay ' } } })
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'decay-fixture-cat' } } })
}

describe('runDecayJob', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    const category = await prisma.category.create({
      data: { name: 'Decay Fixture Cat', nameGu: 'Decay Fixture Cat', slug: `decay-fixture-cat-${Date.now()}`, iconName: 'box' },
    })
    const [pInStock, pOutOfStock, pFresh] = await Promise.all(
      ['Fixture Decay In Stock', 'Fixture Decay Out Of Stock', 'Fixture Decay Fresh'].map((name) =>
        prisma.product.create({
          data: { name, nameGu: name, categoryId: category.id, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: [name.toLowerCase()] },
        }),
      ),
    )
    productInStockId = pInStock.id
    productOutOfStockId = pOutOfStock.id
    productFreshId = pFresh.id

    const owner = await prisma.user.create({
      data: { name: 'Decay Fixture Owner', phone: OWNER_PHONE, role: 'MERCHANT', passwordHash: await argon2.hash('owner-pass') },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Decay Fixture Shop', nameGu: 'Decay Fixture Shop', type: 'KIRANA',
        phone: '9166669996', address: 'Decay Fixture Address', lat: 23.037, lng: 72.5615,
        status: 'ACTIVE',
        openingHours: {
          mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
          wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
          fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
          sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
        },
      },
    })
    shopId = shop.id
  })

  afterAll(async () => {
    await cleanup()
    await clock.reset()
    await prisma.$disconnect()
  })

  it('THE test that matters: advancing the clock 30h decays a fresh IN_STOCK row to USUALLY_AVAILABLE, badge included, with an AUTO_DECAY event written', async () => {
    // Confirmed "just now" — should read as "In stock".
    await prisma.shopInventory.create({
      data: {
        shopId, productId: productInStockId, price: 40,
        availability: 'IN_STOCK', availabilityUpdatedAt: clock.now(), availabilitySource: 'MERCHANT_MANUAL',
      },
    })

    const thresholdsBefore = await getDecayThresholds()
    const before = await prisma.shopInventory.findUniqueOrThrow({
      where: { shopId_productId: { shopId, productId: productInStockId } },
    })
    const badgeBefore = computeBadge(before.availability, before.availabilityUpdatedAt, clock.now(), thresholdsBefore)
    expect(badgeBefore.label).toBe('In stock')

    // Time-travel 30 hours — well past both the "In stock" freshness window
    // (2h) and the "Likely available" window (24h).
    await clock.advanceHours(30)

    const result = await runDecayJob()
    expect(result.decayedCount).toBeGreaterThanOrEqual(1)

    const after = await prisma.shopInventory.findUniqueOrThrow({
      where: { shopId_productId: { shopId, productId: productInStockId } },
    })
    expect(after.availability).toBe('USUALLY_AVAILABLE')
    expect(after.availabilitySource).toBe('AUTO_DECAY')

    const thresholdsAfter = await getDecayThresholds()
    const badgeAfter = computeBadge(after.availability, after.availabilityUpdatedAt, clock.now(), thresholdsAfter)
    expect(badgeAfter.label).toBe('Usually available')
    expect(badgeBefore.label).not.toBe(badgeAfter.label)

    const event = await prisma.availabilityEvent.findFirst({
      where: { shopId, productId: productInStockId, source: 'AUTO_DECAY' },
      orderBy: { createdAt: 'desc' },
    })
    expect(event).toBeTruthy()
    expect(event?.previousAvailability).toBe('IN_STOCK')
    expect(event?.newAvailability).toBe('USUALLY_AVAILABLE')
  })

  it('also decays a stale OUT_OF_STOCK row to USUALLY_AVAILABLE (assume restocked)', async () => {
    await clock.reset()
    await prisma.shopInventory.create({
      data: {
        shopId, productId: productOutOfStockId, price: 40,
        availability: 'OUT_OF_STOCK', availabilityUpdatedAt: clock.now(), availabilitySource: 'MERCHANT_MANUAL',
      },
    })

    await clock.advanceHours(30) // past the 12h outOfStockTrustHours default

    await runDecayJob()

    const after = await prisma.shopInventory.findUniqueOrThrow({
      where: { shopId_productId: { shopId, productId: productOutOfStockId } },
    })
    expect(after.availability).toBe('USUALLY_AVAILABLE')
    expect(after.availabilitySource).toBe('AUTO_DECAY')

    const event = await prisma.availabilityEvent.findFirst({
      where: { shopId, productId: productOutOfStockId, source: 'AUTO_DECAY' },
    })
    expect(event?.previousAvailability).toBe('OUT_OF_STOCK')
  })

  it('leaves a freshly-confirmed IN_STOCK row untouched — decay only ever moves stale rows', async () => {
    await clock.reset()
    await prisma.shopInventory.create({
      data: {
        shopId, productId: productFreshId, price: 40,
        availability: 'IN_STOCK', availabilityUpdatedAt: clock.now(), availabilitySource: 'MERCHANT_MANUAL',
      },
    })

    await runDecayJob()

    const after = await prisma.shopInventory.findUniqueOrThrow({
      where: { shopId_productId: { shopId, productId: productFreshId } },
    })
    expect(after.availability).toBe('IN_STOCK')
    expect(after.availabilitySource).toBe('MERCHANT_MANUAL')

    const event = await prisma.availabilityEvent.findFirst({ where: { shopId, productId: productFreshId } })
    expect(event).toBeNull()
  })
})
