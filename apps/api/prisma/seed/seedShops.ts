import type { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import type { Rng } from './random'
import { ANCHOR, offsetPoint } from './geo'
import { SHOP_SEED } from './data/shops'
import { SEED_NOW } from './clock'

export const DEMO_PASSWORD = 'demo1234'
export const ADMIN_PASSWORD = 'admin1234'

const CUSTOMER_NAMES = [
  'Asha Shah', 'Nikhil Desai', 'Priya Mehta', 'Rohit Joshi',
  'Sneha Trivedi', 'Amit Rana', 'Kavita Bhatt', 'Manish Solanki',
]

const OPENING_HOURS = {
  mon: { open: '09:00', close: '21:00' }, tue: { open: '09:00', close: '21:00' },
  wed: { open: '09:00', close: '21:00' }, thu: { open: '09:00', close: '21:00' },
  fri: { open: '09:00', close: '21:00' }, sat: { open: '09:00', close: '21:00' },
  sun: { open: '10:00', close: '14:00' }, isTemporarilyClosed: false,
}

/** Ages in minutes, chosen so every badge in spec §7 appears in the UI. */
const AGE_BUCKETS_MINUTES = [5, 45, 90, 200, 600, 1_500, 4_000, 8_000, 13_000]

export async function seedUsersAndShops(
  prisma: PrismaClient,
  rng: Rng,
  catalogue: { productsByName: Record<string, { id: string; basePrice: number }> },
) {
  const demoHash = await argon2.hash(DEMO_PASSWORD)
  const adminHash = await argon2.hash(ADMIN_PASSWORD)

  const admin = await prisma.user.create({
    data: { name: 'ShopNear Admin', phone: '9000000000', email: 'admin@shopnear.local',
            role: 'ADMIN', passwordHash: adminHash },
  })

  // The default customer sits at the anchor; shop distances are measured
  // from here, which is what the "80 m away" copy in the demo refers to.
  const customers: string[] = []
  let defaultCustomerAddress = { lat: ANCHOR.lat, lng: ANCHOR.lng }

  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const phone = `900000000${i + 1}`
    const customer = await prisma.user.create({
      data: { name: CUSTOMER_NAMES[i], phone, role: 'CUSTOMER', preferredLanguage: 'en' },
    })
    const at = i === 0 ? ANCHOR : offsetPoint(ANCHOR.lat, ANCHOR.lng, rng.int(200, 2000), rng.int(0, 359))
    const address = await prisma.address.create({
      data: { userId: customer.id, label: 'Home', line1: `${rng.int(1, 90)}, Navrangpura`,
              landmark: 'Near Vijay Cross Road', pincode: '380009', lat: at.lat, lng: at.lng },
    })
    await prisma.user.update({
      where: { id: customer.id }, data: { defaultAddressId: address.id },
    })
    if (i === 0) defaultCustomerAddress = { lat: at.lat, lng: at.lng }
    customers.push(customer.id)
  }

  const productNames = Object.keys(catalogue.productsByName)
  const shopIds: string[] = []
  // Two owners in SHOP_SEED run a second shop, so we key owners by phone and
  // reuse the same user instead of creating a duplicate merchant account.
  const ownerIdByPhone = new Map<string, string>()

  for (const s of SHOP_SEED) {
    let ownerId = ownerIdByPhone.get(s.ownerPhone)
    if (!ownerId) {
      const owner = await prisma.user.create({
        data: { name: s.ownerName, phone: s.ownerPhone, role: 'MERCHANT',
                passwordHash: demoHash, preferredLanguage: rng.pick(['en', 'hi', 'gu'] as const) },
      })
      ownerId = owner.id
      ownerIdByPhone.set(s.ownerPhone, ownerId)
    }
    const at = offsetPoint(ANCHOR.lat, ANCHOR.lng, s.distanceMetres, s.bearing)
    const shop = await prisma.shop.create({
      data: {
        ownerId, name: s.name, nameGu: s.nameGu, type: s.type,
        description: s.description, phone: s.ownerPhone, address: s.address,
        lat: at.lat, lng: at.lng, status: s.status, openingHours: OPENING_HOURS,
        acceptsDelivery: s.acceptsDelivery,
        deliveryRadiusMeters: s.acceptsDelivery ? rng.int(800, 2500) : 0,
        minOrderValue: s.acceptsDelivery ? rng.pick([99, 149, 199]) : 0,
        deliveryFee: s.acceptsDelivery ? rng.pick([10, 15, 20]) : 0,
      },
    })
    // Prisma cannot write geography; keep it in step with lat/lng here.
    await prisma.$executeRaw`
      UPDATE "Shop" SET location = ST_SetSRID(ST_MakePoint(${at.lng}, ${at.lat}), 4326)::geography
      WHERE id = ${shop.id}
    `

    const chosen = rng.sample(productNames, rng.int(80, 200))
    for (const name of chosen) {
      const ageMinutes = rng.pick(AGE_BUCKETS_MINUTES)
      const updatedAt = new Date(SEED_NOW.getTime() - ageMinutes * 60_000)
      const product = catalogue.productsByName[name]
      await prisma.shopInventory.create({
        data: {
          shopId: shop.id, productId: product.id,
          // ±8% around the product's reference price (spec §11), so the same
          // item is comparable across shops instead of randomly priced.
          price: Number((product.basePrice * rng.float(0.92, 1.08)).toFixed(2)),
          availability: rng.pick(['IN_STOCK', 'IN_STOCK', 'IN_STOCK',
                                  'USUALLY_AVAILABLE', 'OUT_OF_STOCK', 'UNKNOWN'] as const),
          availabilityUpdatedAt: updatedAt,
          availabilitySource: 'SEED',
          confirmCount: rng.int(0, 25),
          rejectCount: rng.int(0, 5),
        },
      })
    }
    shopIds.push(shop.id)
  }

  return { shopIds, customerIds: customers, adminId: admin.id, defaultCustomerAddress }
}
