import { PrismaClient } from '@prisma/client'
import { createRng, SEED } from './seed/random'
import { seedCatalogue } from './seed/seedCatalogue'
import { seedUsersAndShops, DEMO_PASSWORD, ADMIN_PASSWORD } from './seed/seedShops'
import { seedHistory } from './seed/seedHistory'

const prisma = new PrismaClient()

async function main() {
  const started = Date.now()
  // One RNG threaded through every stage: reordering stages changes the
  // dataset, so keep this call order stable.
  const rng = createRng(SEED)

  console.log('Seeding catalogue...')
  const catalogue = await seedCatalogue(prisma, rng)

  console.log('Seeding users, shops, and inventory...')
  const ctx = await seedUsersAndShops(prisma, rng, catalogue)

  console.log('Seeding order history...')
  await seedHistory(prisma, rng, ctx)

  const [products, shops, inventory, orders] = await Promise.all([
    prisma.product.count(), prisma.shop.count(),
    prisma.shopInventory.count(), prisma.order.count(),
  ])

  console.log(`
────────────────────────────────────────────────────────
  ShopNear seeded in ${((Date.now() - started) / 1000).toFixed(1)}s
────────────────────────────────────────────────────────
  ${products} products · ${shops} shops · ${inventory} inventory rows · ${orders} orders

  DEMO ACCOUNTS
  Customer : 9000000001            OTP ....... 123456
  Merchant : 9000000010            password .. ${DEMO_PASSWORD}   (Shreeji Kirana, 80 m away)
  Merchant : 9000000011            password .. ${DEMO_PASSWORD}   (Patel General Store, 340 m away)
  Admin    : admin@shopnear.local  password .. ${ADMIN_PASSWORD}
────────────────────────────────────────────────────────
`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
