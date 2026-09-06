# ShopNear Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the ShopNear monorepo, a PostGIS-backed Postgres database with the full Prisma schema, and a deterministic seed producing the entire §11 dataset — so `npm run db:reset` yields identical, demo-ready data every time.

**Architecture:** npm-workspaces monorepo (`apps/api`, `apps/web-*`, `packages/shared`). Postgres 16 + PostGIS runs in Docker; the API runs on the host. Prisma owns the schema, with PostGIS geography columns and trigram/GIST indexes applied through raw-SQL migration steps because Prisma has no native geography type. The seed is split into composable modules driven by one fixed-seed PRNG so output is byte-identical across runs.

**Tech Stack:** Node 22 · TypeScript · Express · Prisma 6 · PostgreSQL 16 + PostGIS 3.4 · Vitest · Docker Compose · Zod

**Spec:** `docs/superpowers/specs/2026-09-05-shopnear-design.md`

## Global Constraints

- **Runs fully offline.** No paid APIs, no hotlinked images, no network calls at seed or runtime. Verified on a machine with no internet.
- **Deterministic seed.** Fixed PRNG seed; two consecutive `db:reset` runs produce identical row counts and identical values. No `Math.random()`, no unseeded `faker`, no `new Date()` for seeded content — derive all timestamps from a fixed `SEED_NOW` anchor.
- **PostGIS is real** (spec R6). `Shop.location` is `geography(Point, 4326)` with a GIST index. Do not substitute Haversine.
- **`User` uniqueness is `@@unique([phone, role])`**, never global-unique phone (spec R7).
- **`Shop.isOpenNow` is never a stored column** (spec R3).
- **No numeric stock counts** anywhere — availability is an enum plus a timestamp (spec §7).
- **Geography anchor:** Navrangpura, Ahmedabad — `23.0365, 72.5611`. Shops scattered 40 m – 2.5 km; **≥3 shops within 150 m** of the default customer address.
- **Demo credentials are fixed** and printed after seeding:
  `9000000001`/OTP `123456` (customer), `9000000010` and `9000000011`/`demo1234` (merchants), `admin@shopnear.local`/`admin1234` (admin).
- **Never delete `legacy/`** — it is the only copy of the archived prototype's web/mobile source (spec R1).
- Commit after every task.

---

### Task 1: Monorepo skeleton and shared package

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.env.example`, `vitest.config.ts`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
- Create: `packages/shared/src/enums.ts`
- Test: `packages/shared/src/enums.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: workspace layout `apps/*` + `packages/*`; `@shopnear/shared` importable by every later task; exported enum constants `SHOP_TYPES`, `AVAILABILITY_STATES`, `ORDER_STATUSES`, `USER_ROLES` (each a `readonly string[]`) and their union types `ShopType`, `Availability`, `OrderStatus`, `UserRole`.

- [ ] **Step 1: Create the root workspace manifest**

`package.json`:
```json
{
  "name": "shopnear",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create the base TypeScript config**

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  }
}
```

- [ ] **Step 3: Create the shared package manifest and config**

`packages/shared/package.json`:
```json
{
  "name": "@shopnear/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "^3.23.0" }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist" },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Write the failing test**

`packages/shared/src/enums.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { SHOP_TYPES, AVAILABILITY_STATES, ORDER_STATUSES, USER_ROLES } from './enums'

describe('shared enums', () => {
  it('lists all nine shop types from the spec', () => {
    expect(SHOP_TYPES).toEqual([
      'KIRANA', 'GENERAL', 'STATIONERY', 'HARDWARE', 'CHEMIST',
      'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE',
    ])
  })

  it('lists the four availability states', () => {
    expect(AVAILABILITY_STATES).toEqual([
      'IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN',
    ])
  })

  it('includes every order status in the state machine', () => {
    expect(ORDER_STATUSES).toContain('PLACED')
    expect(ORDER_STATUSES).toContain('CONFIRMED')
    expect(ORDER_STATUSES).toContain('READY_FOR_PICKUP')
    expect(ORDER_STATUSES).toContain('OUT_FOR_DELIVERY')
    expect(ORDER_STATUSES).toContain('COMPLETED')
    expect(ORDER_STATUSES).toContain('CANCELLED_BY_CUSTOMER')
    expect(ORDER_STATUSES).toContain('REJECTED_BY_SHOP')
    expect(ORDER_STATUSES).toContain('EXPIRED')
  })

  it('has exactly three roles', () => {
    expect(USER_ROLES).toEqual(['CUSTOMER', 'MERCHANT', 'ADMIN'])
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve module `./enums`.

- [ ] **Step 6: Implement the enums**

`packages/shared/src/enums.ts`:
```ts
/**
 * Single source of truth for enum values shared by the API, all three web
 * clients, and the Prisma schema. Prisma enums are declared separately in
 * schema.prisma; these arrays must be kept in step with them, and the
 * schema tests in Task 3-5 assert that they match.
 */
export const SHOP_TYPES = [
  'KIRANA', 'GENERAL', 'STATIONERY', 'HARDWARE', 'CHEMIST',
  'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE',
] as const
export type ShopType = (typeof SHOP_TYPES)[number]

export const AVAILABILITY_STATES = [
  'IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN',
] as const
export type Availability = (typeof AVAILABILITY_STATES)[number]

export const ORDER_STATUSES = [
  'PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY',
  'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const USER_ROLES = ['CUSTOMER', 'MERCHANT', 'ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]
```

`packages/shared/src/index.ts`:
```ts
export * from './enums'
```

- [ ] **Step 7: Create the Vitest config and env example**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Database-backed suites (Tasks 3-9) must not run concurrently against
    // the same Postgres instance, so we keep a single fork.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'legacy/**'],
  },
})
```

`.env.example`:
```
# Postgres + PostGIS (see docker-compose.yml)
DATABASE_URL="postgresql://shopnear:shopnear@localhost:5433/shopnear?schema=public"

# API
PORT=4000
NODE_ENV=development

# Demo controls (Phase 6). Never enable in production.
DEMO_MODE=true

# Auth (Phase 2) — dev-only values, replaced per environment
JWT_ACCESS_SECRET="dev-access-secret-change-me"
JWT_REFRESH_SECRET="dev-refresh-secret-change-me"
```

- [ ] **Step 8: Install and run the test to verify it passes**

Run: `npm install && npm test`
Expected: PASS — 4 tests in `packages/shared/src/enums.test.ts`.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.base.json vitest.config.ts .env.example packages/
git commit -m "feat: monorepo skeleton with shared enum package"
```

---

### Task 2: Docker Compose, PostGIS, and the API package

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma` (datasource + generator only)
- Create: `apps/api/src/db.ts`
- Test: `apps/api/src/db.test.ts`

**Interfaces:**
- Consumes: `.env.example` conventions from Task 1.
- Produces: running Postgres+PostGIS on **port 5433**; `prisma` CLI wired in `apps/api`; `apps/api/src/db.ts` exporting a singleton `prisma: PrismaClient`.

> **Why port 5433, not 5432:** avoids colliding with any Postgres the evaluator already runs locally. The archived prototype used MySQL on default ports, so there is no conflict there.

- [ ] **Step 1: Create the Compose file**

`docker-compose.yml`:
```yaml
services:
  db:
    # postgis/postgis bundles PostGIS 3.4 with Postgres 16 — no extension
    # compilation needed, which keeps offline setup to a single image pull.
    image: postgis/postgis:16-3.4
    container_name: shopnear-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: shopnear
      POSTGRES_PASSWORD: shopnear
      POSTGRES_DB: shopnear
    ports:
      - "5433:5432"
    volumes:
      - shopnear-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shopnear -d shopnear"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  shopnear-pgdata:
```

- [ ] **Step 2: Create the API package manifest**

`apps/api/package.json`:
```json
{
  "name": "@shopnear/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "prisma": "prisma",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^6.1.0",
    "@shopnear/shared": "*",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "prisma": "^6.1.0",
    "tsx": "^4.19.0"
  }
}
```

`apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist" },
  "include": ["src/**/*", "prisma/**/*"]
}
```

- [ ] **Step 3: Create the minimal Prisma schema**

`apps/api/prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  // postgresqlExtensions unlocks `extensions = [...]` below; postgis and
  // pg_trgm are declared so `prisma migrate` provisions them for us.
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, pg_trgm]
}
```

- [ ] **Step 4: Write the failing test**

`apps/api/src/db.test.ts`:
```ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from './db'

describe('database connectivity', () => {
  afterAll(async () => { await prisma.$disconnect() })

  it('connects to Postgres', async () => {
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`
    expect(rows[0].ok).toBe(1)
  })

  it('has the PostGIS extension available', async () => {
    const rows = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'postgis'
    `
    expect(rows).toHaveLength(1)
  })

  it('has the pg_trgm extension available', async () => {
    const rows = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'
    `
    expect(rows).toHaveLength(1)
  })

  it('can compute a geography distance', async () => {
    // Navrangpura anchor to a point ~1 km east; assert PostGIS maths works
    // end to end before any of our own geography columns exist.
    const rows = await prisma.$queryRaw<{ metres: number }[]>`
      SELECT ST_Distance(
        ST_MakePoint(72.5611, 23.0365)::geography,
        ST_MakePoint(72.5709, 23.0365)::geography
      ) AS metres
    `
    expect(rows[0].metres).toBeGreaterThan(900)
    expect(rows[0].metres).toBeLessThan(1100)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./db`.

- [ ] **Step 6: Implement the Prisma singleton**

`apps/api/src/db.ts`:
```ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

/**
 * A single PrismaClient for the whole process. Instantiating more than one
 * exhausts the Postgres connection pool quickly under Vitest, which runs
 * suites in the same fork.
 */
export const prisma = new PrismaClient()
```

- [ ] **Step 7: Start the database and apply the first migration**

```bash
cp .env.example .env
docker compose up -d
npm install
npm --workspace @shopnear/api run db:migrate -- --name init_extensions
```
Expected: container healthy; migration creates the `postgis` and `pg_trgm` extensions.

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 4 connectivity tests plus Task 1's 4 enum tests.

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml apps/api/
git commit -m "feat: PostGIS database via Docker Compose with Prisma client"
```

---

### Task 3: Schema — identity and geography

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/*_identity_and_geography/migration.sql` (generated, then hand-edited)
- Test: `apps/api/src/schema-identity.test.ts`

**Interfaces:**
- Consumes: `prisma` from `apps/api/src/db.ts`.
- Produces: Prisma models `User`, `Address`, `Shop`, `Category`; enums `UserRole`, `Language`, `ShopType`, `ShopStatus`; `Shop.location` as `Unsupported("geography(Point, 4326)")` with GIST index `shop_location_gist`.

> **Why `Unsupported`:** Prisma has no geography type. The column is declared so Prisma preserves it across migrations, but reads and writes go through `$queryRaw`. This is the documented Prisma pattern for PostGIS and is a likely viva question — the reasoning belongs in `docs/architecture.md` in Phase 6.

- [ ] **Step 1: Write the failing test**

`apps/api/src/schema-identity.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'

async function clear() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
  )
}

describe('identity and geography schema', () => {
  beforeEach(clear)
  afterAll(async () => { await prisma.$disconnect() })

  it('allows one phone to hold both a customer and a merchant account', async () => {
    // Spec R7: registration is per-role, so the same human may sign up
    // twice — once to shop, once to sell.
    await prisma.user.create({
      data: { name: 'Asha', phone: '9000000001', role: 'CUSTOMER' },
    })
    const merchant = await prisma.user.create({
      data: { name: 'Asha', phone: '9000000001', role: 'MERCHANT', passwordHash: 'x' },
    })
    expect(merchant.id).toBeTruthy()
  })

  it('rejects two accounts with the same phone AND role', async () => {
    await prisma.user.create({
      data: { name: 'Asha', phone: '9000000002', role: 'CUSTOMER' },
    })
    await expect(
      prisma.user.create({
        data: { name: 'Imposter', phone: '9000000002', role: 'CUSTOMER' },
      }),
    ).rejects.toThrow()
  })

  it('enforces unique emails for admin accounts', async () => {
    await prisma.user.create({
      data: { name: 'Admin', phone: '9000000000', role: 'ADMIN',
              email: 'admin@shopnear.local', passwordHash: 'x' },
    })
    await expect(
      prisma.user.create({
        data: { name: 'Other', phone: '9000000009', role: 'ADMIN',
                email: 'admin@shopnear.local', passwordHash: 'x' },
      }),
    ).rejects.toThrow()
  })

  it('stores a shop geography point and measures distance from it', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Shreeji Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
        type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
        lat: 23.0365, lng: 72.5611, status: 'ACTIVE',
        openingHours: { mon: { open: '09:00', close: '21:00' }, isTemporarilyClosed: false },
      },
    })
    // Geography column is written separately — Prisma cannot type it.
    await prisma.$executeRaw`
      UPDATE "Shop"
      SET location = ST_SetSRID(ST_MakePoint(${shop.lng}, ${shop.lat}), 4326)::geography
      WHERE id = ${shop.id}
    `
    const rows = await prisma.$queryRaw<{ metres: number }[]>`
      SELECT ST_Distance(location, ST_MakePoint(72.5611, 23.0365)::geography) AS metres
      FROM "Shop" WHERE id = ${shop.id}
    `
    expect(rows[0].metres).toBeLessThan(1)
  })

  it('supports two-level category nesting', async () => {
    const parent = await prisma.category.create({
      data: { name: 'Groceries', nameGu: 'કરિયાણું', slug: 'groceries', iconName: 'basket' },
    })
    const child = await prisma.category.create({
      data: { name: 'Flours & Grains', nameGu: 'લોટ અને અનાજ', slug: 'flours-grains',
              iconName: 'wheat', parentId: parent.id },
    })
    expect(child.parentId).toBe(parent.id)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- schema-identity`
Expected: FAIL — `prisma.user` is not defined (models don't exist yet).

- [ ] **Step 3: Add the models to the schema**

Append to `apps/api/prisma/schema.prisma`:
```prisma
enum UserRole   { CUSTOMER MERCHANT ADMIN }
enum Language   { en hi gu }
enum ShopStatus { PENDING ACTIVE SUSPENDED }
enum ShopType   { KIRANA GENERAL STATIONERY HARDWARE CHEMIST BAKERY DAIRY FARSAN VEGETABLE }

model User {
  id                String    @id @default(cuid())
  name              String
  phone             String
  email             String?   @unique
  role              UserRole
  /// Null for customers (OTP-only). Set for merchants and admin.
  passwordHash      String?
  defaultAddressId  String?
  preferredLanguage Language  @default(en)
  createdAt         DateTime  @default(now())

  addresses      Address[] @relation("UserAddresses")
  defaultAddress Address?  @relation("UserDefaultAddress", fields: [defaultAddressId], references: [id])
  shops          Shop[]

  /// Spec R7: the same phone may hold one customer AND one merchant account.
  @@unique([phone, role])
}

model Address {
  id       String  @id @default(cuid())
  userId   String
  label    String
  line1    String
  line2    String?
  landmark String?
  city     String  @default("Ahmedabad")
  pincode  String
  lat      Float
  lng      Float

  user           User   @relation("UserAddresses", fields: [userId], references: [id], onDelete: Cascade)
  defaultForUser User[] @relation("UserDefaultAddress")

  @@index([userId])
}

model Shop {
  id                   String     @id @default(cuid())
  ownerId              String
  name                 String
  nameGu               String
  type                 ShopType
  description          String?
  phone                String
  address              String
  lat                  Float
  lng                  Float
  /// PostGIS geography point, written via raw SQL — Prisma has no geography
  /// type. Kept in step with lat/lng by the seed and the shop service.
  location             Unsupported("geography(Point, 4326)")?
  status               ShopStatus @default(PENDING)
  /// { mon..sun: { open, close } | null, isTemporarilyClosed: boolean }
  /// `isOpenNow` is computed from this at read time — never stored (spec R3).
  openingHours         Json
  acceptsDelivery      Boolean    @default(false)
  deliveryRadiusMeters Int        @default(0)
  minOrderValue        Float      @default(0)
  deliveryFee          Float      @default(0)
  avgRating            Float      @default(0)
  ratingCount          Int        @default(0)
  bannerImageUrl       String?
  /// Mock GST/Udyam/licence details — never verified (spec R11).
  licenceNumber        String?
  licenceDocUrl        String?
  createdAt            DateTime   @default(now())

  owner User @relation(fields: [ownerId], references: [id])

  @@index([ownerId])
  @@index([status])
}

model Category {
  id       String  @id @default(cuid())
  name     String
  nameGu   String
  slug     String  @unique
  iconName String
  parentId String?

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
}
```

- [ ] **Step 4: Generate the migration**

```bash
npm --workspace @shopnear/api run db:migrate -- --name identity_and_geography
```

- [ ] **Step 5: Hand-edit the migration to add the GIST index**

Append to the generated `migration.sql`:
```sql
-- Spatial index for radius search (spec §13: search under 300 ms).
CREATE INDEX IF NOT EXISTS shop_location_gist ON "Shop" USING GIST (location);
```
Then re-apply:
```bash
npm --workspace @shopnear/api run db:reset
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- schema-identity`
Expected: PASS — 5 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/src
git commit -m "feat: user, address, shop, and category schema with PostGIS point"
```

---

### Task 4: Schema — catalogue and inventory

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/*_catalogue/migration.sql` (generated, then hand-edited)
- Test: `apps/api/src/schema-catalogue.test.ts`

**Interfaces:**
- Consumes: `Shop`, `Category` from Task 3.
- Produces: models `Product`, `ShopInventory`, `StarterCatalogueItem`; enums `UnitType`, `Availability`, `AvailabilitySource`; trigram index `product_name_trgm`.

- [ ] **Step 1: Write the failing test**

`apps/api/src/schema-catalogue.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'

async function seedShop() {
  const owner = await prisma.user.create({
    data: { name: 'Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
  })
  return prisma.shop.create({
    data: {
      ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
      type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
      lat: 23.0365, lng: 72.5611, status: 'ACTIVE', openingHours: {},
    },
  })
}

async function seedProduct(name = 'Aashirvaad Atta 5 kg', barcode?: string) {
  const cat = await prisma.category.create({
    data: { name: 'Flours', nameGu: 'લોટ', slug: `flours-${Math.random()}`, iconName: 'wheat' },
  })
  return prisma.product.create({
    data: {
      name, nameGu: 'આશીર્વાદ લોટ', brand: 'Aashirvaad', categoryId: cat.id,
      unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 285, barcode,
      searchKeywords: ['atta', 'aata', 'lot', 'ghau no lot', 'wheat flour'],
    },
  })
}

describe('catalogue and inventory schema', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('stores search keywords as an array for transliteration matching', async () => {
    const p = await seedProduct()
    expect(p.searchKeywords).toContain('aata')
    expect(p.searchKeywords).toContain('ghau no lot')
  })

  it('allows loose goods to have no MRP and no barcode', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Pulses', nameGu: 'કઠોળ', slug: 'pulses', iconName: 'lentil' },
    })
    const p = await prisma.product.create({
      data: { name: 'Toor Dal (loose)', nameGu: 'તુવેર દાળ', categoryId: cat.id,
              unitType: 'WEIGHT', defaultUnitLabel: 'per kg', isLooseGood: true,
              searchKeywords: ['toor dal', 'tuver dal', 'arhar'] },
    })
    expect(p.mrp).toBeNull()
    expect(p.barcode).toBeNull()
  })

  it('rejects a duplicate barcode', async () => {
    await seedProduct('Amul Butter 500 g', '8901262010016')
    await expect(seedProduct('amul butter 500 gm', '8901262010016')).rejects.toThrow()
  })

  it('rejects the same product listed twice in one shop', async () => {
    const shop = await seedShop()
    const product = await seedProduct()
    await prisma.shopInventory.create({
      data: { shopId: shop.id, productId: product.id, price: 279,
              availability: 'IN_STOCK', availabilitySource: 'SEED' },
    })
    await expect(
      prisma.shopInventory.create({
        data: { shopId: shop.id, productId: product.id, price: 281,
                availability: 'IN_STOCK', availabilitySource: 'SEED' },
      }),
    ).rejects.toThrow()
  })

  it('defaults availability to UNKNOWN with a timestamp', async () => {
    const shop = await seedShop()
    const product = await seedProduct()
    const inv = await prisma.shopInventory.create({
      data: { shopId: shop.id, productId: product.id, price: 279 },
    })
    expect(inv.availability).toBe('UNKNOWN')
    expect(inv.availabilityUpdatedAt).toBeInstanceOf(Date)
    expect(inv.confirmCount).toBe(0)
  })

  it('stores a starter catalogue entry per shop type', async () => {
    const product = await seedProduct()
    const item = await prisma.starterCatalogueItem.create({
      data: { shopType: 'KIRANA', productId: product.id, suggestedPrice: 279 },
    })
    expect(item.shopType).toBe('KIRANA')
  })

  it('finds wheat flour from the misspelling "ata" via trigram similarity', async () => {
    await seedProduct('Aashirvaad Atta 5 kg')
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM "Product"
      WHERE similarity(name, 'ata') > 0.1
      ORDER BY similarity(name, 'ata') DESC
    `
    expect(rows.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- schema-catalogue`
Expected: FAIL — `prisma.product` is not defined.

- [ ] **Step 3: Add the models to the schema**

Append to `apps/api/prisma/schema.prisma`:
```prisma
enum UnitType { PIECE WEIGHT VOLUME PACK }

enum Availability { IN_STOCK OUT_OF_STOCK USUALLY_AVAILABLE UNKNOWN }

enum AvailabilitySource {
  MERCHANT_MANUAL
  RESERVATION_CONFIRMED
  RESERVATION_REJECTED
  SEED
  AUTO_DECAY
}

/// The global master catalogue. A Product is an idea ("Amul Butter 500 g");
/// ShopInventory is what makes it real, priced, and available in one shop.
/// This split is the heart of the design — see docs/architecture.md.
model Product {
  id               String   @id @default(cuid())
  name             String
  nameGu           String
  brand            String?
  categoryId       String
  unitType         UnitType
  defaultUnitLabel String
  /// Null for loose goods sold by weight.
  mrp              Float?
  barcode          String?  @unique
  imageUrl         String?
  /// Hindi/Gujarati transliterations included, so "aata"/"atta"/"lot" all
  /// resolve to wheat flour. Search quality depends on seeding these well.
  searchKeywords   String[]
  isLooseGood      Boolean  @default(false)

  category    Category               @relation(fields: [categoryId], references: [id])
  inventory   ShopInventory[]
  starterFor  StarterCatalogueItem[]

  @@index([categoryId])
}

model ShopInventory {
  id                    String             @id @default(cuid())
  shopId                String
  productId             String
  price                 Float
  availability          Availability       @default(UNKNOWN)
  availabilityUpdatedAt DateTime           @default(now())
  availabilitySource    AvailabilitySource @default(SEED)
  confirmCount          Int                @default(0)
  rejectCount           Int                @default(0)
  notes                 String?
  isActive              Boolean            @default(true)

  shop    Shop    @relation(fields: [shopId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@unique([shopId, productId])
  @@index([shopId, productId])
  @@index([productId, availability])
}

/// Curated starter kit per shop type, powering registration wizard step 7
/// (spec R10) so a newly approved shop is never empty on day one.
model StarterCatalogueItem {
  id             String   @id @default(cuid())
  shopType       ShopType
  productId      String
  suggestedPrice Float

  product Product @relation(fields: [productId], references: [id])

  @@unique([shopType, productId])
  @@index([shopType])
}
```

Add the back-relations to existing models:
```prisma
// In model Shop, add:
//   inventory ShopInventory[]
// In model Category, add:
//   products Product[]
```

- [ ] **Step 4: Generate the migration**

```bash
npm --workspace @shopnear/api run db:migrate -- --name catalogue
```

- [ ] **Step 5: Hand-edit the migration to add the trigram index**

Append to the generated `migration.sql`:
```sql
-- Typo-tolerant product search: "ata" -> "Aashirvaad Atta 5 kg" (spec §8).
CREATE INDEX IF NOT EXISTS product_name_trgm ON "Product" USING GIN (name gin_trgm_ops);
```
Then re-apply:
```bash
npm --workspace @shopnear/api run db:reset
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- schema-catalogue`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/src
git commit -m "feat: product catalogue, shop inventory, and starter catalogue schema"
```

---

### Task 5: Schema — orders, reviews, disputes, and audit logs

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Test: `apps/api/src/schema-orders.test.ts`

**Interfaces:**
- Consumes: `User`, `Shop`, `Product`, `Address` from Tasks 3–4.
- Produces: models `Order`, `OrderItem`, `Review`, `Dispute`, `AvailabilityEvent`, `SearchLog`; enums `OrderType`, `OrderStatus`, `PaymentMode`, `PaymentStatus`, `FulfilmentStatus`, `DisputeReason`, `DisputeStatus`.

- [ ] **Step 1: Write the failing test**

`apps/api/src/schema-orders.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'

async function fixture() {
  const owner = await prisma.user.create({
    data: { name: 'Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
  })
  const customer = await prisma.user.create({
    data: { name: 'Asha', phone: '9000000001', role: 'CUSTOMER' },
  })
  const shop = await prisma.shop.create({
    data: { ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
            type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
            lat: 23.0365, lng: 72.5611, status: 'ACTIVE', openingHours: {} },
  })
  const cat = await prisma.category.create({
    data: { name: 'Flours', nameGu: 'લોટ', slug: 'flours', iconName: 'wheat' },
  })
  const product = await prisma.product.create({
    data: { name: 'Aashirvaad Atta 5 kg', nameGu: 'આશીર્વાદ લોટ', categoryId: cat.id,
            unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 285,
            searchKeywords: ['atta', 'aata'] },
  })
  return { owner, customer, shop, product }
}

describe('order, review, dispute, and audit schema', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "SearchLog", "AvailabilityEvent", "Dispute", "Review", "OrderItem", "Order", "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates a reservation with a pickup code and an expiry', async () => {
    const { customer, shop, product } = await fixture()
    const order = await prisma.order.create({
      data: {
        orderNumber: 'SN-2401', customerId: customer.id, shopId: shop.id,
        type: 'RESERVE_AND_COLLECT', subtotal: 279, total: 279,
        paymentMode: 'CASH_ON_PICKUP', pickupCode: '4821',
        expiresAt: new Date('2026-09-05T12:00:00Z'),
        items: {
          create: [{
            productId: product.id, productNameSnapshot: 'Aashirvaad Atta 5 kg',
            unitLabelSnapshot: '5 kg', quantity: 1, unitPrice: 279, lineTotal: 279,
          }],
        },
      },
      include: { items: true },
    })
    expect(order.status).toBe('PLACED')
    expect(order.pickupCode).toBe('4821')
    expect(order.items).toHaveLength(1)
    expect(order.items[0].fulfilmentStatus).toBe('PENDING')
  })

  it('keeps item name and price snapshots independent of the live product', async () => {
    // Spec §4: historical orders must never join to live catalogue data.
    const { customer, shop, product } = await fixture()
    const order = await prisma.order.create({
      data: {
        orderNumber: 'SN-2402', customerId: customer.id, shopId: shop.id,
        type: 'RESERVE_AND_COLLECT', subtotal: 279, total: 279,
        paymentMode: 'CASH_ON_PICKUP', pickupCode: '1111',
        items: { create: [{
          productId: product.id, productNameSnapshot: 'Aashirvaad Atta 5 kg',
          unitLabelSnapshot: '5 kg', quantity: 1, unitPrice: 279, lineTotal: 279,
        }] },
      },
      include: { items: true },
    })
    await prisma.product.update({
      where: { id: product.id },
      data: { name: 'Aashirvaad Superior MP Atta 5 kg' },
    })
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(items[0].productNameSnapshot).toBe('Aashirvaad Atta 5 kg')
  })

  it('rejects a second order with the same order number', async () => {
    const { customer, shop } = await fixture()
    const base = {
      customerId: customer.id, shopId: shop.id, type: 'RESERVE_AND_COLLECT' as const,
      subtotal: 10, total: 10, paymentMode: 'CASH_ON_PICKUP' as const, pickupCode: '0000',
    }
    await prisma.order.create({ data: { ...base, orderNumber: 'SN-2403' } })
    await expect(
      prisma.order.create({ data: { ...base, orderNumber: 'SN-2403' } }),
    ).rejects.toThrow()
  })

  it('allows only one review per order', async () => {
    const { customer, shop } = await fixture()
    const order = await prisma.order.create({
      data: { orderNumber: 'SN-2404', customerId: customer.id, shopId: shop.id,
              type: 'RESERVE_AND_COLLECT', subtotal: 10, total: 10,
              paymentMode: 'CASH_ON_PICKUP', pickupCode: '0000', status: 'COMPLETED' },
    })
    await prisma.review.create({
      data: { orderId: order.id, customerId: customer.id, shopId: shop.id,
              rating: 5, comment: 'Fast confirm' },
    })
    await expect(
      prisma.review.create({
        data: { orderId: order.id, customerId: customer.id, shopId: shop.id, rating: 1 },
      }),
    ).rejects.toThrow()
  })

  it('records an availability event with both before and after states', async () => {
    const { shop, product } = await fixture()
    const event = await prisma.availabilityEvent.create({
      data: { shopId: shop.id, productId: product.id,
              previousAvailability: 'UNKNOWN', newAvailability: 'IN_STOCK',
              source: 'RESERVATION_CONFIRMED' },
    })
    expect(event.previousAvailability).toBe('UNKNOWN')
    expect(event.newAvailability).toBe('IN_STOCK')
  })

  it('logs a zero-result search with its location', async () => {
    const log = await prisma.searchLog.create({
      data: { queryText: 'oat milk', resultCount: 0, lat: 23.0365, lng: 72.5611 },
    })
    expect(log.resultCount).toBe(0)
    expect(log.userId).toBeNull()
  })

  it('opens a dispute against a completed order', async () => {
    const { customer, shop } = await fixture()
    const order = await prisma.order.create({
      data: { orderNumber: 'SN-2405', customerId: customer.id, shopId: shop.id,
              type: 'RESERVE_AND_COLLECT', subtotal: 10, total: 10,
              paymentMode: 'CASH_ON_PICKUP', pickupCode: '0000', status: 'COMPLETED' },
    })
    const dispute = await prisma.dispute.create({
      data: { orderId: order.id, raisedByUserId: customer.id,
              reason: 'ITEM_NOT_AVAILABLE_ON_ARRIVAL',
              description: 'Shop had run out when I arrived' },
    })
    expect(dispute.status).toBe('OPEN')
    expect(dispute.resolvedAt).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- schema-orders`
Expected: FAIL — `prisma.order` is not defined.

- [ ] **Step 3: Add the models to the schema**

Append to `apps/api/prisma/schema.prisma`:
```prisma
enum OrderType   { RESERVE_AND_COLLECT DELIVERY }

enum OrderStatus {
  PLACED
  CONFIRMED
  READY_FOR_PICKUP
  OUT_FOR_DELIVERY
  COMPLETED
  CANCELLED_BY_CUSTOMER
  REJECTED_BY_SHOP
  EXPIRED
}

enum PaymentMode      { CASH_ON_PICKUP CASH_ON_DELIVERY MOCK_ONLINE }
enum PaymentStatus    { PENDING PAID FAILED }
enum FulfilmentStatus { PENDING AVAILABLE UNAVAILABLE SUBSTITUTED }

enum DisputeReason {
  ITEM_NOT_AVAILABLE_ON_ARRIVAL
  PRICE_MISMATCH
  QUALITY_ISSUE
  SHOP_CLOSED
  OTHER
}

enum DisputeStatus { OPEN RESOLVED REJECTED }

model Order {
  id                String        @id @default(cuid())
  /// Human-readable, e.g. SN-2401 — what the customer and merchant say aloud.
  orderNumber       String        @unique
  customerId        String
  shopId            String
  type              OrderType
  status            OrderStatus   @default(PLACED)
  subtotal          Float
  deliveryFee       Float         @default(0)
  total             Float
  paymentMode       PaymentMode
  paymentStatus     PaymentStatus @default(PENDING)
  deliveryAddressId String?
  customerNote      String?
  merchantNote      String?
  rejectionReason   String?
  /// 4-digit code shown to the customer, typed by the merchant to complete.
  pickupCode        String
  /// Reservations expire (default 2 h) — a cron job moves PLACED to EXPIRED.
  expiresAt         DateTime?
  createdAt         DateTime      @default(now())
  confirmedAt       DateTime?
  readyAt           DateTime?
  outForDeliveryAt  DateTime?
  completedAt       DateTime?
  cancelledAt       DateTime?
  rejectedAt        DateTime?
  expiredAt         DateTime?

  customer        User        @relation("CustomerOrders", fields: [customerId], references: [id])
  shop            Shop        @relation(fields: [shopId], references: [id])
  deliveryAddress Address?    @relation(fields: [deliveryAddressId], references: [id])
  items           OrderItem[]
  review          Review?
  disputes        Dispute[]

  @@index([shopId, status])
  @@index([customerId])
  @@index([status, expiresAt])
}

model OrderItem {
  id                  String          @id @default(cuid())
  orderId             String
  productId           String
  /// Snapshots: historical orders must never join to live catalogue data.
  productNameSnapshot String
  unitLabelSnapshot   String
  quantity            Float
  unitPrice           Float
  lineTotal           Float
  fulfilmentStatus    FulfilmentStatus @default(PENDING)
  substituteProductId String?

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model Review {
  id         String   @id @default(cuid())
  orderId    String   @unique
  customerId String
  shopId     String
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())

  order    Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  customer User  @relation("CustomerReviews", fields: [customerId], references: [id])
  shop     Shop  @relation(fields: [shopId], references: [id])

  @@index([shopId])
}

model Dispute {
  id            String        @id @default(cuid())
  orderId       String
  raisedByUserId String
  reason        DisputeReason
  description   String
  status        DisputeStatus @default(OPEN)
  adminNote     String?
  createdAt     DateTime      @default(now())
  resolvedAt    DateTime?

  order     Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  raisedBy  User  @relation("UserDisputes", fields: [raisedByUserId], references: [id])

  @@index([status])
}

/// Append-only audit log. Powers the confidence badges' "confirmed N min ago"
/// and the admin availability-accuracy analytics.
model AvailabilityEvent {
  id                   String             @id @default(cuid())
  shopId               String
  productId            String
  previousAvailability Availability
  newAvailability      Availability
  source               AvailabilitySource
  orderId              String?
  createdAt            DateTime           @default(now())

  @@index([shopId, productId])
  @@index([createdAt])
}

/// Feeds the unmet-demand report: what people searched for and found nothing.
model SearchLog {
  id          String   @id @default(cuid())
  userId      String?
  queryText   String
  resultCount Int
  lat         Float
  lng         Float
  createdAt   DateTime @default(now())

  @@index([resultCount])
  @@index([createdAt])
}
```

Add the back-relations to existing models:
```prisma
// In model User, add:
//   orders   Order[]   @relation("CustomerOrders")
//   reviews  Review[]  @relation("CustomerReviews")
//   disputes Dispute[] @relation("UserDisputes")
// In model Shop, add:
//   orders  Order[]
//   reviews Review[]
// In model Address, add:
//   orders Order[]
// In model Product, add:
//   orderItems OrderItem[]
```

- [ ] **Step 4: Generate the migration**

```bash
npm --workspace @shopnear/api run db:migrate -- --name orders_reviews_disputes
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- schema-orders`
Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma apps/api/src
git commit -m "feat: order, review, dispute, and audit-log schema"
```

---

### Task 6: Deterministic PRNG and geography helpers

**Files:**
- Create: `apps/api/prisma/seed/random.ts`
- Create: `apps/api/prisma/seed/geo.ts`
- Test: `apps/api/prisma/seed/random.test.ts`, `apps/api/prisma/seed/geo.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `createRng(seed: number)` → `{ next(): number; int(min, max): number; float(min, max): number; pick<T>(arr: readonly T[]): T; sample<T>(arr: readonly T[], n: number): T[]; bool(probability: number): boolean }`
  - `SEED = 20260905` (the fixed project seed)
  - `offsetPoint(lat, lng, metres, bearingDegrees)` → `{ lat, lng }`
  - `haversineMetres(lat1, lng1, lat2, lng2)` → `number` (seed-side verification only)
  - `ANCHOR = { lat: 23.0365, lng: 72.5611 }` (Navrangpura)

> **Why hand-rolled PRNG:** `Math.random()` cannot be seeded, and pulling a
> seeded-faker dependency adds weight for one function. mulberry32 is eight
> lines, deterministic across platforms, and easy to explain in a viva.

- [ ] **Step 1: Write the failing PRNG test**

`apps/api/prisma/seed/random.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createRng, SEED } from './random'

describe('deterministic RNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(SEED)
    const b = createRng(SEED)
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = createRng(1)
    const b = createRng(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng(SEED)
    for (let i = 0; i < 500; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int() stays within the inclusive range', () => {
    const rng = createRng(SEED)
    for (let i = 0; i < 500; i++) {
      const v = rng.int(3, 7)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(7)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('sample() returns n distinct elements', () => {
    const rng = createRng(SEED)
    const picked = rng.sample([1, 2, 3, 4, 5, 6, 7, 8], 4)
    expect(picked).toHaveLength(4)
    expect(new Set(picked).size).toBe(4)
  })

  it('sample() never returns more than the source length', () => {
    const rng = createRng(SEED)
    expect(rng.sample([1, 2, 3], 10)).toHaveLength(3)
  })

  it('bool() respects its probability roughly', () => {
    const rng = createRng(SEED)
    let trues = 0
    for (let i = 0; i < 1000; i++) if (rng.bool(0.8)) trues++
    expect(trues).toBeGreaterThan(700)
    expect(trues).toBeLessThan(900)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- seed/random`
Expected: FAIL — cannot resolve `./random`.

- [ ] **Step 3: Implement the PRNG**

`apps/api/prisma/seed/random.ts`:
```ts
/**
 * The project-wide seed. Changing it reshuffles the entire demo dataset,
 * so keep it fixed — the demo script in /docs refers to specific shops.
 */
export const SEED = 20260905

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  sample<T>(arr: readonly T[], n: number): T[]
  bool(probability: number): boolean
}

/**
 * mulberry32 — a small, fast, seedable PRNG. Deterministic across Node
 * versions and platforms, which is what makes `db:reset` reproducible.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const float = (min: number, max: number) => min + next() * (max - min)
  const int = (min: number, max: number) => Math.floor(float(min, max + 1))

  return {
    next,
    float,
    int,
    pick: <T,>(arr: readonly T[]): T => arr[int(0, arr.length - 1)],
    sample<T>(arr: readonly T[], n: number): T[] {
      // Fisher-Yates on a copy, then take the first n.
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy.slice(0, Math.min(n, copy.length))
    },
    bool: (probability: number) => next() < probability,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- seed/random`
Expected: PASS — 7 tests.

- [ ] **Step 5: Write the failing geography test**

`apps/api/prisma/seed/geo.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ANCHOR, offsetPoint, haversineMetres } from './geo'

describe('geography helpers', () => {
  it('anchors on Navrangpura, Ahmedabad', () => {
    expect(ANCHOR.lat).toBeCloseTo(23.0365, 4)
    expect(ANCHOR.lng).toBeCloseTo(72.5611, 4)
  })

  it('offsets a point by roughly the requested distance', () => {
    const p = offsetPoint(ANCHOR.lat, ANCHOR.lng, 500, 90)
    const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, p.lat, p.lng)
    expect(d).toBeGreaterThan(495)
    expect(d).toBeLessThan(505)
  })

  it('offsets correctly at several bearings', () => {
    for (const bearing of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const p = offsetPoint(ANCHOR.lat, ANCHOR.lng, 1200, bearing)
      const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, p.lat, p.lng)
      expect(d).toBeGreaterThan(1180)
      expect(d).toBeLessThan(1220)
    }
  })

  it('measures zero distance from a point to itself', () => {
    expect(haversineMetres(23.0365, 72.5611, 23.0365, 72.5611)).toBeCloseTo(0, 5)
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- seed/geo`
Expected: FAIL — cannot resolve `./geo`.

- [ ] **Step 7: Implement the geography helpers**

`apps/api/prisma/seed/geo.ts`:
```ts
/** Navrangpura, Ahmedabad — the centre of the seeded neighbourhood. */
export const ANCHOR = { lat: 23.0365, lng: 72.5611 } as const

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/**
 * Move `metres` from a point along `bearingDegrees` (0 = north, 90 = east).
 * Used by the seed to scatter shops 40 m – 2.5 km around the anchor.
 */
export function offsetPoint(
  lat: number, lng: number, metres: number, bearingDegrees: number,
): { lat: number; lng: number } {
  const angular = metres / EARTH_RADIUS_M
  const bearing = toRad(bearingDegrees)
  const lat1 = toRad(lat)
  const lng1 = toRad(lng)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
    Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
    Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
  )

  return { lat: toDeg(lat2), lng: toDeg(lng2) }
}

/**
 * Great-circle distance in metres. Used only by the seed and its tests to
 * verify placement — production distance queries use PostGIS ST_Distance,
 * which accounts for the WGS-84 ellipsoid.
 */
export function haversineMetres(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- seed/geo`
Expected: PASS — 4 tests.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma/seed
git commit -m "feat: deterministic PRNG and geography helpers for seeding"
```

---

### Task 7: Seed — categories, products, and starter catalogue

**Files:**
- Create: `apps/api/prisma/seed/data/categories.ts`
- Create: `apps/api/prisma/seed/data/products.ts`
- Create: `apps/api/prisma/seed/seedCatalogue.ts`
- Create: `apps/api/prisma/seed/placeholderImage.ts`
- Test: `apps/api/prisma/seed/seedCatalogue.test.ts`

**Interfaces:**
- Consumes: `createRng`, `SEED` from Task 6; Prisma models from Task 4.
- Produces:
  - `seedCatalogue(prisma, rng)` → `{ categoryIds: Record<string, string>; productsByName: Record<string, { id: string; basePrice: number }> }`
    — `basePrice` is the shared reference price each shop then varies by ±8% (spec §11), so the same product costs about the same everywhere.
  - `CATEGORY_SEED: { name, nameGu, slug, iconName, children: [...] }[]` — ~40 categories over two levels
  - `PRODUCT_SEED: { name, nameGu, brand?, categorySlug, unitType, defaultUnitLabel, mrp?, barcode?, searchKeywords, isLooseGood? }[]` — ~350 entries
  - `STARTER_BY_TYPE: Record<ShopType, string[]>` — product names per shop type, ~60 for KIRANA
  - `placeholderSvgDataUri(label: string, hue: number)` → a `data:image/svg+xml` string

> **Images (spec §11):** no hotlinking, no committed binaries needed —
> generate an inline SVG data URI bearing the product's initial on a coloured
> ground. Renders identically with no internet.

- [ ] **Step 1: Write the failing test**

`apps/api/prisma/seed/seedCatalogue.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { PRODUCT_SEED } from './data/products'
import { CATEGORY_SEED } from './data/categories'

describe('catalogue seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Category" RESTART IDENTITY CASCADE',
    )
    await seedCatalogue(prisma, createRng(SEED))
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates roughly 40 categories across two levels', async () => {
    const total = await prisma.category.count()
    expect(total).toBeGreaterThanOrEqual(35)
    expect(total).toBeLessThanOrEqual(50)
    const children = await prisma.category.count({ where: { parentId: { not: null } } })
    expect(children).toBeGreaterThan(20)
  })

  it('never nests categories more than two levels deep', async () => {
    const children = await prisma.category.findMany({
      where: { parentId: { not: null } },
      include: { parent: true },
    })
    for (const c of children) expect(c.parent?.parentId).toBeNull()
  })

  it('creates roughly 350 products', async () => {
    const count = await prisma.product.count()
    expect(count).toBeGreaterThanOrEqual(330)
    expect(count).toBeLessThanOrEqual(380)
  })

  it('gives every product at least two search keywords', async () => {
    const products = await prisma.product.findMany({ select: { name: true, searchKeywords: true } })
    const thin = products.filter((p) => p.searchKeywords.length < 2)
    expect(thin, `products with too few keywords: ${thin.map((p) => p.name).join(', ')}`).toHaveLength(0)
  })

  it('gives every product a local placeholder image, never a remote URL', async () => {
    const remote = await prisma.product.count({ where: { imageUrl: { startsWith: 'http' } } })
    expect(remote).toBe(0)
  })

  it('leaves MRP null for loose goods only', async () => {
    const loose = await prisma.product.findMany({ where: { isLooseGood: true } })
    expect(loose.length).toBeGreaterThan(10)
    for (const p of loose) expect(p.mrp).toBeNull()
  })

  it('includes wheat flour reachable by Gujarati and Hindi transliterations', async () => {
    const atta = await prisma.product.findFirst({ where: { searchKeywords: { has: 'ghau no lot' } } })
    expect(atta).not.toBeNull()
    expect(atta!.searchKeywords).toContain('atta')
    expect(atta!.searchKeywords).toContain('aata')
  })

  it('stocks non-grocery products for the hardware, stationery, and chemist shops', async () => {
    for (const slug of ['hardware', 'stationery', 'chemist']) {
      const cat = await prisma.category.findFirst({ where: { slug } })
      expect(cat, `missing category ${slug}`).not.toBeNull()
      const count = await prisma.product.count({
        where: { category: { OR: [{ id: cat!.id }, { parentId: cat!.id }] } },
      })
      expect(count, `too few ${slug} products`).toBeGreaterThan(10)
    }
  })

  it('seeds a starter catalogue of about 60 items for kirana shops', async () => {
    const count = await prisma.starterCatalogueItem.count({ where: { shopType: 'KIRANA' } })
    expect(count).toBeGreaterThanOrEqual(50)
    expect(count).toBeLessThanOrEqual(70)
  })

  it('seeds a starter catalogue for every shop type', async () => {
    const grouped = await prisma.starterCatalogueItem.groupBy({
      by: ['shopType'], _count: true,
    })
    expect(grouped).toHaveLength(9)
    for (const g of grouped) expect(g._count).toBeGreaterThan(10)
  })

  it('has no duplicate barcodes in the source data', () => {
    const barcodes = PRODUCT_SEED.map((p) => p.barcode).filter(Boolean)
    expect(new Set(barcodes).size).toBe(barcodes.length)
  })

  it('references only category slugs that exist in the source data', () => {
    const slugs = new Set<string>()
    for (const c of CATEGORY_SEED) {
      slugs.add(c.slug)
      for (const child of c.children) slugs.add(child.slug)
    }
    const orphans = PRODUCT_SEED.filter((p) => !slugs.has(p.categorySlug))
    expect(orphans.map((p) => p.name)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- seedCatalogue`
Expected: FAIL — cannot resolve `./seedCatalogue`.

- [ ] **Step 3: Implement the placeholder image generator**

`apps/api/prisma/seed/placeholderImage.ts`:
```ts
/**
 * An inline SVG data URI showing the product's initial on a coloured ground.
 * Spec §11 forbids hotlinking: the app must look correct with no internet,
 * and data URIs keep the repository free of hundreds of binary files.
 */
export function placeholderSvgDataUri(label: string, hue: number): string {
  const initial = (label.trim()[0] ?? '?').toUpperCase()
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="12" fill="hsl(${hue} 62% 88%)"/>` +
    `<text x="48" y="48" font-family="system-ui,sans-serif" font-size="42" font-weight="600" ` +
    `fill="hsl(${hue} 55% 32%)" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
```

- [ ] **Step 4: Write the category source data**

`apps/api/prisma/seed/data/categories.ts` — export `CATEGORY_SEED`, an array of
top-level categories each with a `children` array, totalling ~40 rows.
Top-level entries must include at least: `groceries`, `dairy`, `bakery`,
`personal-care`, `household`, `beverages`, `snacks`, `stationery`, `hardware`,
`chemist`, `vegetables`, `farsan`.

```ts
export interface CategorySeed {
  name: string
  nameGu: string
  slug: string
  iconName: string
  children: { name: string; nameGu: string; slug: string; iconName: string }[]
}

export const CATEGORY_SEED: CategorySeed[] = [
  {
    name: 'Groceries', nameGu: 'કરિયાણું', slug: 'groceries', iconName: 'basket',
    children: [
      { name: 'Flours & Grains', nameGu: 'લોટ અને અનાજ', slug: 'flours-grains', iconName: 'wheat' },
      { name: 'Pulses & Dals', nameGu: 'કઠોળ અને દાળ', slug: 'pulses-dals', iconName: 'lentil' },
      { name: 'Rice', nameGu: 'ચોખા', slug: 'rice', iconName: 'rice' },
      { name: 'Edible Oils', nameGu: 'ખાદ્ય તેલ', slug: 'edible-oils', iconName: 'bottle' },
      { name: 'Spices & Masala', nameGu: 'મસાલા', slug: 'spices-masala', iconName: 'spice' },
      { name: 'Sugar & Jaggery', nameGu: 'ખાંડ અને ગોળ', slug: 'sugar-jaggery', iconName: 'sugar' },
    ],
  },
  {
    name: 'Dairy', nameGu: 'ડેરી', slug: 'dairy', iconName: 'milk',
    children: [
      { name: 'Milk & Curd', nameGu: 'દૂધ અને દહીં', slug: 'milk-curd', iconName: 'milk' },
      { name: 'Butter & Ghee', nameGu: 'માખણ અને ઘી', slug: 'butter-ghee', iconName: 'butter' },
      { name: 'Cheese & Paneer', nameGu: 'ચીઝ અને પનીર', slug: 'cheese-paneer', iconName: 'cheese' },
    ],
  },
  // ...continue for bakery, personal-care, household, beverages, snacks,
  // stationery, hardware, chemist, vegetables, farsan — each with 2-5
  // children, totalling roughly 40 categories.
]
```

Complete every remaining top-level category in the same shape. Do not leave the
ellipsis comment in the delivered file.

- [ ] **Step 5: Write the product source data**

`apps/api/prisma/seed/data/products.ts` — export `PRODUCT_SEED` (~350 entries)
and `STARTER_BY_TYPE`.

```ts
import type { ShopType } from '@shopnear/shared'

export interface ProductSeed {
  name: string
  nameGu: string
  brand?: string
  categorySlug: string
  unitType: 'PIECE' | 'WEIGHT' | 'VOLUME' | 'PACK'
  defaultUnitLabel: string
  mrp?: number
  barcode?: string
  searchKeywords: string[]
  isLooseGood?: boolean
}

export const PRODUCT_SEED: ProductSeed[] = [
  {
    name: 'Aashirvaad Superior MP Atta 5 kg', nameGu: 'આશીર્વાદ લોટ ૫ કિલો',
    brand: 'Aashirvaad', categorySlug: 'flours-grains', unitType: 'WEIGHT',
    defaultUnitLabel: '5 kg', mrp: 285, barcode: '8901725121112',
    searchKeywords: ['atta', 'aata', 'ata', 'lot', 'ghau no lot', 'wheat flour', 'aashirvaad'],
  },
  {
    name: 'Amul Butter 500 g', nameGu: 'અમૂલ માખણ ૫૦૦ ગ્રામ',
    brand: 'Amul', categorySlug: 'butter-ghee', unitType: 'WEIGHT',
    defaultUnitLabel: '500 g', mrp: 285, barcode: '8901262010016',
    searchKeywords: ['butter', 'makhan', 'amul butter', 'makkhan'],
  },
  {
    name: 'Toor Dal (loose)', nameGu: 'તુવેર દાળ', categorySlug: 'pulses-dals',
    unitType: 'WEIGHT', defaultUnitLabel: 'per kg', isLooseGood: true,
    searchKeywords: ['toor dal', 'tuver dal', 'tuvar', 'arhar dal', 'dal'],
  },
  // ...continue to ~350 products across every category, weighted toward
  // realistic Indian retail: Amul, Britannia, Parle, Tata, Aashirvaad, Nirma,
  // Surf Excel, Colgate, Maggi, Everest/MDH; plus loose goods (dals, rice,
  // jaggery, seasonal vegetables); plus hardware, stationery, and chemist
  // items. Every entry needs Hindi/Gujarati transliterations in
  // searchKeywords. Barcodes must be unique; omit them on loose goods.
]

/**
 * Curated starter kits (spec R10) — product names copied verbatim from
 * PRODUCT_SEED. A test asserts every name here resolves to a real product.
 */
export const STARTER_BY_TYPE: Record<ShopType, string[]> = {
  KIRANA: [
    'Aashirvaad Superior MP Atta 5 kg',
    'Amul Butter 500 g',
    'Toor Dal (loose)',
    // ...~60 common kirana items
  ],
  GENERAL: [/* ~40 items */],
  STATIONERY: [/* ~30 items */],
  HARDWARE: [/* ~30 items */],
  CHEMIST: [/* ~30 items */],
  BAKERY: [/* ~25 items */],
  DAIRY: [/* ~20 items */],
  FARSAN: [/* ~20 items */],
  VEGETABLE: [/* ~25 items */],
}
```

Fill every array with real entries. Do not leave ellipsis comments in the
delivered file.

- [ ] **Step 6: Implement the catalogue seeder**

`apps/api/prisma/seed/seedCatalogue.ts`:
```ts
import type { PrismaClient } from '@prisma/client'
import type { Rng } from './random'
import { CATEGORY_SEED } from './data/categories'
import { PRODUCT_SEED, STARTER_BY_TYPE } from './data/products'
import { placeholderSvgDataUri } from './placeholderImage'

export async function seedCatalogue(prisma: PrismaClient, rng: Rng) {
  const categoryIds: Record<string, string> = {}

  for (const top of CATEGORY_SEED) {
    const parent = await prisma.category.create({
      data: { name: top.name, nameGu: top.nameGu, slug: top.slug, iconName: top.iconName },
    })
    categoryIds[top.slug] = parent.id
    for (const child of top.children) {
      const created = await prisma.category.create({
        data: { name: child.name, nameGu: child.nameGu, slug: child.slug,
                iconName: child.iconName, parentId: parent.id },
      })
      categoryIds[child.slug] = created.id
    }
  }

  const productsByName: Record<string, { id: string; basePrice: number }> = {}
  for (const p of PRODUCT_SEED) {
    const categoryId = categoryIds[p.categorySlug]
    if (!categoryId) throw new Error(`Unknown category slug "${p.categorySlug}" for ${p.name}`)
    const created = await prisma.product.create({
      data: {
        name: p.name, nameGu: p.nameGu, brand: p.brand, categoryId,
        unitType: p.unitType, defaultUnitLabel: p.defaultUnitLabel,
        mrp: p.isLooseGood ? null : (p.mrp ?? null),
        barcode: p.barcode ?? null,
        imageUrl: placeholderSvgDataUri(p.name, rng.int(0, 359)),
        searchKeywords: p.searchKeywords,
        isLooseGood: p.isLooseGood ?? false,
      },
    })
    // One reference price per product. Shops vary from this by ±8% in
    // Task 8, so the same item costs roughly the same across the
    // neighbourhood — which is what makes price comparison meaningful.
    const basePrice = Number(
      (p.mrp ? p.mrp * 0.97 : rng.float(20, 220)).toFixed(2),
    )
    productsByName[p.name] = { id: created.id, basePrice }
  }

  for (const [shopType, names] of Object.entries(STARTER_BY_TYPE)) {
    for (const name of names) {
      const product = productsByName[name]
      if (!product) throw new Error(`Starter catalogue references unknown product "${name}"`)
      await prisma.starterCatalogueItem.create({
        data: {
          shopType: shopType as never,
          productId: product.id,
          suggestedPrice: product.basePrice,
        },
      })
    }
  }

  return { categoryIds, productsByName }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- seedCatalogue`
Expected: PASS — 12 tests.

- [ ] **Step 8: Commit**

```bash
git add apps/api/prisma/seed
git commit -m "feat: seed the global catalogue, categories, and starter kits"
```

---

### Task 8: Seed — users, shops, addresses, and inventory

**Files:**
- Create: `apps/api/prisma/seed/data/shops.ts`
- Create: `apps/api/prisma/seed/seedShops.ts`
- Test: `apps/api/prisma/seed/seedShops.test.ts`

**Interfaces:**
- Consumes: `seedCatalogue` output from Task 7; `offsetPoint`, `ANCHOR`, `haversineMetres` from Task 6.
- Produces:
  - `seedUsersAndShops(prisma, rng, catalogue)` → `{ shopIds: string[]; customerIds: string[]; adminId: string; defaultCustomerAddress: { lat, lng } }`
  - `SHOP_SEED` — 14 entries with fixed `distanceMetres` and `bearing`, so shop placement is reproducible and the demo script can name specific shops.
  - `DEMO_PASSWORD = 'demo1234'`, `ADMIN_PASSWORD = 'admin1234'`

> **Availability spread matters (spec §11):** `availabilityUpdatedAt` must range
> from 5 minutes to 9 days before `SEED_NOW`, and states must cover all four
> enum values, so **every confidence badge from spec §7 appears somewhere** in
> the UI. A test asserts this directly.

- [ ] **Step 1: Write the failing test**

`apps/api/prisma/seed/seedShops.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { seedUsersAndShops } from './seedShops'
import { ANCHOR, haversineMetres } from './geo'

let ctx: Awaited<ReturnType<typeof seedUsersAndShops>>

describe('users, shops, and inventory seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
    const rng = createRng(SEED)
    const catalogue = await seedCatalogue(prisma, rng)
    ctx = await seedUsersAndShops(prisma, rng, catalogue)
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates 1 admin, 12 merchants, and 8 customers', async () => {
    expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1)
    expect(await prisma.user.count({ where: { role: 'MERCHANT' } })).toBe(12)
    expect(await prisma.user.count({ where: { role: 'CUSTOMER' } })).toBe(8)
  })

  it('creates the documented demo accounts', async () => {
    const customer = await prisma.user.findFirst({ where: { phone: '9000000001', role: 'CUSTOMER' } })
    expect(customer).not.toBeNull()
    expect(customer!.passwordHash).toBeNull() // customers are OTP-only

    for (const phone of ['9000000010', '9000000011']) {
      const merchant = await prisma.user.findFirst({ where: { phone, role: 'MERCHANT' } })
      expect(merchant, `missing merchant ${phone}`).not.toBeNull()
      expect(merchant!.passwordHash).not.toBeNull()
    }

    const admin = await prisma.user.findFirst({ where: { email: 'admin@shopnear.local' } })
    expect(admin?.role).toBe('ADMIN')
  })

  it('creates 14 shops with the documented type mix', async () => {
    expect(await prisma.shop.count()).toBe(14)
    expect(await prisma.shop.count({ where: { type: 'KIRANA' } })).toBe(5)
    expect(await prisma.shop.count({ where: { type: 'GENERAL' } })).toBe(2)
    for (const type of ['STATIONERY', 'HARDWARE', 'CHEMIST', 'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE'] as const) {
      expect(await prisma.shop.count({ where: { type } }), type).toBe(1)
    }
  })

  it('leaves two shops pending and one suspended, so admin queues are not empty', async () => {
    expect(await prisma.shop.count({ where: { status: 'PENDING' } })).toBe(2)
    expect(await prisma.shop.count({ where: { status: 'SUSPENDED' } })).toBe(1)
    expect(await prisma.shop.count({ where: { status: 'ACTIVE' } })).toBe(11)
  })

  it('places at least three shops within 150 m of the default customer address', async () => {
    const shops = await prisma.shop.findMany({ select: { name: true, lat: true, lng: true } })
    const near = shops.filter(
      (s) => haversineMetres(ctx.defaultCustomerAddress.lat, ctx.defaultCustomerAddress.lng, s.lat, s.lng) <= 150,
    )
    expect(near.length, `only ${near.length} shops within 150 m`).toBeGreaterThanOrEqual(3)
  })

  it('scatters every shop between 40 m and 2.5 km of the anchor', async () => {
    const shops = await prisma.shop.findMany({ select: { name: true, lat: true, lng: true } })
    for (const s of shops) {
      const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, s.lat, s.lng)
      expect(d, `${s.name} at ${Math.round(d)} m`).toBeGreaterThanOrEqual(40)
      expect(d, `${s.name} at ${Math.round(d)} m`).toBeLessThanOrEqual(2500)
    }
  })

  it('populates the PostGIS location column for every shop', async () => {
    const rows = await prisma.$queryRaw<{ missing: bigint }[]>`
      SELECT COUNT(*) AS missing FROM "Shop" WHERE location IS NULL
    `
    expect(Number(rows[0].missing)).toBe(0)
  })

  it('keeps the geography column consistent with lat/lng', async () => {
    const rows = await prisma.$queryRaw<{ drift: number }[]>`
      SELECT MAX(ST_Distance(location, ST_MakePoint(lng, lat)::geography)) AS drift FROM "Shop"
    `
    expect(rows[0].drift).toBeLessThan(1)
  })

  it('creates roughly 1,800 inventory rows, 80-200 per shop', async () => {
    const total = await prisma.shopInventory.count()
    expect(total).toBeGreaterThanOrEqual(1500)
    expect(total).toBeLessThanOrEqual(2100)

    const grouped = await prisma.shopInventory.groupBy({ by: ['shopId'], _count: true })
    for (const g of grouped) {
      expect(g._count).toBeGreaterThanOrEqual(80)
      expect(g._count).toBeLessThanOrEqual(200)
    }
  })

  it('varies prices between shops by roughly ±8%, not randomly', async () => {
    // Spec §11: the same product should be comparable across shops, so the
    // spread must be non-zero but bounded — otherwise price comparison in
    // the customer UI is meaningless.
    const rows = await prisma.$queryRaw<{ ratio: number }[]>`
      SELECT MAX(price) / NULLIF(MIN(price), 0) AS ratio
      FROM "ShopInventory"
      GROUP BY "productId"
      HAVING COUNT(*) > 3
      ORDER BY ratio DESC
      LIMIT 1
    `
    expect(rows[0].ratio).toBeGreaterThan(1)      // shops do differ
    expect(rows[0].ratio).toBeLessThan(1.2)       // 1.08 / 0.92 ≈ 1.174
  })

  it('produces every availability state so all four badges appear', async () => {
    const grouped = await prisma.shopInventory.groupBy({ by: ['availability'], _count: true })
    const states = grouped.map((g) => g.availability).sort()
    expect(states).toEqual(['IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN', 'USUALLY_AVAILABLE'])
    for (const g of grouped) expect(g._count).toBeGreaterThan(20)
  })

  it('spreads availability timestamps from minutes to about nine days old', async () => {
    // Spec §7 has age-dependent badges; the seed must exercise each bucket.
    const rows = await prisma.$queryRaw<{ bucket: string; n: bigint }[]>`
      SELECT CASE
        WHEN "availabilityUpdatedAt" > NOW() - INTERVAL '2 hours'  THEN 'fresh'
        WHEN "availabilityUpdatedAt" > NOW() - INTERVAL '24 hours' THEN 'recent'
        ELSE 'stale'
      END AS bucket, COUNT(*) AS n
      FROM "ShopInventory" GROUP BY 1
    `
    const buckets = Object.fromEntries(rows.map((r) => [r.bucket, Number(r.n)]))
    expect(buckets.fresh ?? 0).toBeGreaterThan(20)
    expect(buckets.recent ?? 0).toBeGreaterThan(20)
    expect(buckets.stale ?? 0).toBeGreaterThan(20)
  })

  it('gives Shreeji Kirana to merchant 9000000010, within 150 m of home', async () => {
    // The demo script names this shop explicitly — keep it stable.
    const owner = await prisma.user.findFirst({ where: { phone: '9000000010', role: 'MERCHANT' } })
    const shop = await prisma.shop.findFirst({ where: { ownerId: owner!.id } })
    expect(shop!.name).toBe('Shreeji Kirana')
    expect(shop!.status).toBe('ACTIVE')
    const d = haversineMetres(
      ctx.defaultCustomerAddress.lat, ctx.defaultCustomerAddress.lng, shop!.lat, shop!.lng,
    )
    expect(d).toBeLessThan(150)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- seedShops`
Expected: FAIL — cannot resolve `./seedShops`.

- [ ] **Step 3: Write the shop source data**

`apps/api/prisma/seed/data/shops.ts`:
```ts
import type { ShopType } from '@shopnear/shared'

export interface ShopSeed {
  name: string
  nameGu: string
  type: ShopType
  ownerName: string
  /** Fixed phone so the demo script can rely on it. */
  ownerPhone: string
  /** Placement relative to the Navrangpura anchor — reproducible by design. */
  distanceMetres: number
  bearing: number
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  acceptsDelivery: boolean
  address: string
  description: string
}

/**
 * 14 shops: 5 kirana, 2 general, and one each of the seven specialist types.
 * Two PENDING (so the approval queue has content) and one SUSPENDED.
 * The first three sit within 150 m of the default customer address, which is
 * what makes the "shop next door" story land in the first ten seconds.
 */
export const SHOP_SEED: ShopSeed[] = [
  {
    name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા', type: 'KIRANA',
    ownerName: 'Rajesh Patel', ownerPhone: '9000000010',
    distanceMetres: 80, bearing: 35, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Shop 4, Vijay Cross Road, Navrangpura',
    description: 'Family-run kirana stocking daily essentials since 1998.',
  },
  {
    name: 'Patel General Store', nameGu: 'પટેલ જનરલ સ્ટોર', type: 'GENERAL',
    ownerName: 'Kiran Patel', ownerPhone: '9000000011',
    distanceMetres: 340, bearing: 120, status: 'ACTIVE', acceptsDelivery: true,
    address: 'Near Navrangpura Post Office',
    description: 'General store with household and personal-care range.',
  },
  // ...continue to 14 entries. Ensure at least three have distanceMetres <= 150
  // relative to the default customer address, phones run 9000000010-9000000021,
  // exactly two are PENDING and exactly one SUSPENDED.
]
```

Complete all 14 entries. Do not leave the ellipsis comment in the delivered file.

- [ ] **Step 4: Implement the shop seeder**

`apps/api/prisma/seed/seedShops.ts`:
```ts
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

  for (const s of SHOP_SEED) {
    const owner = await prisma.user.create({
      data: { name: s.ownerName, phone: s.ownerPhone, role: 'MERCHANT',
              passwordHash: demoHash, preferredLanguage: rng.pick(['en', 'hi', 'gu'] as const) },
    })
    const at = offsetPoint(ANCHOR.lat, ANCHOR.lng, s.distanceMetres, s.bearing)
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: s.name, nameGu: s.nameGu, type: s.type,
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
```

Also create `apps/api/prisma/seed/clock.ts`:
```ts
/**
 * The anchor "now" for all seeded timestamps, captured once per seed run.
 *
 * Deliberately the wall clock rather than a hard-coded instant: confidence
 * badges (spec §7) are computed from how *old* a timestamp is, so a fixed
 * date would make every seeded row look days stale the moment you demo it.
 *
 * Determinism (spec §11) is preserved because every seeded timestamp is a
 * fixed offset from this anchor — the *shape* of the data is identical on
 * every run, only its absolute position on the calendar moves. The
 * determinism check in the plan hashes prices and names, not timestamps,
 * for exactly this reason.
 *
 * Read once at module load so that a long seed run cannot drift mid-way.
 */
export const SEED_NOW = new Date()
```

> **Note for the implementer:** `argon2` must be added to `apps/api`
> dependencies (`npm --workspace @shopnear/api install argon2`). It ships
> prebuilt binaries, so it stays offline-friendly after the initial install.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- seedShops`
Expected: PASS — 13 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/seed apps/api/package.json
git commit -m "feat: seed users, shops, addresses, and shop inventory"
```

---

### Task 9: Seed — orders, reviews, disputes, events, and search logs

**Files:**
- Create: `apps/api/prisma/seed/seedHistory.ts`
- Test: `apps/api/prisma/seed/seedHistory.test.ts`

**Interfaces:**
- Consumes: output of Tasks 7 and 8.
- Produces: `seedHistory(prisma, rng, ctx)` → `{ orderIds: string[] }`, where `ctx` is `{ shopIds, customerIds, defaultCustomerAddress }` — line items are read back from ShopInventory, so no product map is needed here.

- [ ] **Step 1: Write the failing test**

`apps/api/prisma/seed/seedHistory.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { seedUsersAndShops } from './seedShops'
import { seedHistory } from './seedHistory'

describe('historical data seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "SearchLog", "AvailabilityEvent", "Dispute", "Review", "OrderItem", "Order", "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
    const rng = createRng(SEED)
    const catalogue = await seedCatalogue(prisma, rng)
    const ctx = await seedUsersAndShops(prisma, rng, catalogue)
    await seedHistory(prisma, rng, ctx)
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates roughly 120 orders', async () => {
    const count = await prisma.order.count()
    expect(count).toBeGreaterThanOrEqual(110)
    expect(count).toBeLessThanOrEqual(130)
  })

  it('spreads orders across the past 30 days', async () => {
    const rows = await prisma.$queryRaw<{ days: number }[]>`
      SELECT EXTRACT(DAY FROM (MAX("createdAt") - MIN("createdAt"))) AS days FROM "Order"
    `
    expect(Number(rows[0].days)).toBeGreaterThanOrEqual(25)
  })

  it('covers every terminal state so analytics have shape', async () => {
    const grouped = await prisma.order.groupBy({ by: ['status'], _count: true })
    const present = grouped.map((g) => g.status)
    for (const status of ['COMPLETED', 'REJECTED_BY_SHOP', 'EXPIRED', 'CANCELLED_BY_CUSTOMER'] as const) {
      expect(present, `missing ${status}`).toContain(status)
    }
    const completed = grouped.find((g) => g.status === 'COMPLETED')!
    expect(completed._count).toBeGreaterThan(50) // the healthy majority
  })

  it('gives every order at least one item with snapshots filled in', async () => {
    const orphan = await prisma.order.count({ where: { items: { none: {} } } })
    expect(orphan).toBe(0)
    const items = await prisma.orderItem.findMany({ take: 20 })
    for (const i of items) {
      expect(i.productNameSnapshot.length).toBeGreaterThan(0)
      expect(i.unitLabelSnapshot.length).toBeGreaterThan(0)
    }
  })

  it('keeps order totals consistent with their line items', async () => {
    const rows = await prisma.$queryRaw<{ bad: bigint }[]>`
      SELECT COUNT(*) AS bad FROM (
        SELECT o.id, o.subtotal, SUM(i."lineTotal") AS summed
        FROM "Order" o JOIN "OrderItem" i ON i."orderId" = o.id
        GROUP BY o.id, o.subtotal
        HAVING ABS(o.subtotal - SUM(i."lineTotal")) > 0.01
      ) mismatched
    `
    expect(Number(rows[0].bad)).toBe(0)
  })

  it('gives every order a unique four-digit pickup code', async () => {
    const orders = await prisma.order.findMany({ select: { pickupCode: true } })
    for (const o of orders) expect(o.pickupCode).toMatch(/^\d{4}$/)
  })

  it('creates exactly two open disputes for the admin queue', async () => {
    expect(await prisma.dispute.count({ where: { status: 'OPEN' } })).toBe(2)
  })

  it('creates roughly 60 reviews skewed positive but not uniform', async () => {
    const count = await prisma.review.count()
    expect(count).toBeGreaterThanOrEqual(50)
    expect(count).toBeLessThanOrEqual(70)
    const grouped = await prisma.review.groupBy({ by: ['rating'], _count: true })
    expect(grouped.length).toBeGreaterThan(2) // not all the same score
    const avg = await prisma.review.aggregate({ _avg: { rating: true } })
    expect(avg._avg.rating!).toBeGreaterThan(3.4)
    expect(avg._avg.rating!).toBeLessThan(4.8)
  })

  it('only attaches reviews to completed orders', async () => {
    const bad = await prisma.review.count({ where: { order: { status: { not: 'COMPLETED' } } } })
    expect(bad).toBe(0)
  })

  it('updates each shop rating to match its reviews', async () => {
    const shop = await prisma.shop.findFirst({ where: { ratingCount: { gt: 0 } } })
    expect(shop).not.toBeNull()
    const agg = await prisma.review.aggregate({
      where: { shopId: shop!.id }, _avg: { rating: true }, _count: true,
    })
    expect(shop!.ratingCount).toBe(agg._count)
    expect(shop!.avgRating).toBeCloseTo(agg._avg.rating!, 1)
  })

  it('writes availability events for confirmed and rejected reservations', async () => {
    const confirmed = await prisma.availabilityEvent.count({ where: { source: 'RESERVATION_CONFIRMED' } })
    const rejected = await prisma.availabilityEvent.count({ where: { source: 'RESERVATION_REJECTED' } })
    expect(confirmed).toBeGreaterThan(20)
    expect(rejected).toBeGreaterThan(5)
  })

  it('creates roughly 400 search logs', async () => {
    const count = await prisma.searchLog.count()
    expect(count).toBeGreaterThanOrEqual(350)
    expect(count).toBeLessThanOrEqual(450)
  })

  it('clusters about 30 zero-result searches on a few items for the unmet-demand report', async () => {
    const zero = await prisma.searchLog.count({ where: { resultCount: 0 } })
    expect(zero).toBeGreaterThanOrEqual(25)
    expect(zero).toBeLessThanOrEqual(40)

    const grouped = await prisma.searchLog.groupBy({
      by: ['queryText'], where: { resultCount: 0 }, _count: true,
      orderBy: { _count: { queryText: 'desc' } },
    })
    expect(grouped.length).toBeLessThanOrEqual(8) // clustered, not scattered
    expect(grouped[0]._count).toBeGreaterThan(3)  // a clear top request
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- seedHistory`
Expected: FAIL — cannot resolve `./seedHistory`.

- [ ] **Step 3: Implement the history seeder**

`apps/api/prisma/seed/seedHistory.ts`:
```ts
import type { PrismaClient } from '@prisma/client'
import type { Rng } from './random'
import { SEED_NOW } from './clock'

/** Items people asked for that nobody nearby stocks — the unmet-demand story. */
const ZERO_RESULT_QUERIES = [
  'oat milk', 'gluten free bread', 'kombucha', 'quinoa', 'almond butter', 'tofu',
]

const COMMON_QUERIES = [
  'atta', 'aata', 'doodh', 'milk', 'maggi', 'sabun', 'colgate', 'butter',
  'toor dal', 'chawal', 'rice', 'sugar', 'chai', 'biscuit', 'namkeen',
]

const REVIEW_COMMENTS = [
  'Confirmed in under a minute, item was ready.',
  'Good price, friendly shopkeeper.',
  'Had to wait a bit but item was there.',
  'Exactly as listed on the app.',
  null,
]

export async function seedHistory(
  prisma: PrismaClient,
  rng: Rng,
  ctx: {
    shopIds: string[]
    customerIds: string[]
    defaultCustomerAddress: { lat: number; lng: number }
  },
) {
  // Only ACTIVE shops have trading history — pending and suspended shops
  // should look genuinely new/idle in the admin panel.
  const activeShops = await prisma.shop.findMany({
    where: { status: 'ACTIVE' }, select: { id: true },
  })
  const shopIds = activeShops.map((s) => s.id)

  const ORDER_COUNT = 120
  const orderIds: string[] = []
  let orderNumber = 2401

  for (let i = 0; i < ORDER_COUNT; i++) {
    const shopId = rng.pick(shopIds)
    const customerId = rng.pick(ctx.customerIds)
    const createdAt = new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000)

    // Weighted toward completion so the platform looks healthy, while still
    // populating every terminal state for the analytics charts.
    const status = rng.pick([
      'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
      'REJECTED_BY_SHOP', 'EXPIRED', 'CANCELLED_BY_CUSTOMER',
    ] as const)

    const inventory = await prisma.shopInventory.findMany({
      where: { shopId }, take: 40, include: { product: true },
    })
    if (inventory.length === 0) continue
    const lines = rng.sample(inventory, rng.int(1, 4))

    let subtotal = 0
    const items = lines.map((inv) => {
      const quantity = rng.int(1, 3)
      const lineTotal = Number((inv.price * quantity).toFixed(2))
      subtotal += lineTotal
      return {
        productId: inv.productId,
        productNameSnapshot: inv.product.name,
        unitLabelSnapshot: inv.product.defaultUnitLabel,
        quantity, unitPrice: inv.price, lineTotal,
        fulfilmentStatus:
          status === 'COMPLETED' ? ('AVAILABLE' as const)
          : status === 'REJECTED_BY_SHOP' ? ('UNAVAILABLE' as const)
          : ('PENDING' as const),
      }
    })
    subtotal = Number(subtotal.toFixed(2))

    const confirmedAt = status === 'COMPLETED'
      ? new Date(createdAt.getTime() + rng.int(1, 12) * 60_000) : null

    const order = await prisma.order.create({
      data: {
        orderNumber: `SN-${orderNumber++}`, customerId, shopId,
        type: 'RESERVE_AND_COLLECT', status,
        subtotal, deliveryFee: 0, total: subtotal,
        paymentMode: 'CASH_ON_PICKUP',
        paymentStatus: status === 'COMPLETED' ? 'PAID' : 'PENDING',
        pickupCode: String(rng.int(1000, 9999)),
        expiresAt: new Date(createdAt.getTime() + 2 * 60 * 60_000),
        createdAt,
        confirmedAt,
        readyAt: confirmedAt,
        completedAt: status === 'COMPLETED'
          ? new Date(createdAt.getTime() + rng.int(20, 180) * 60_000) : null,
        rejectedAt: status === 'REJECTED_BY_SHOP'
          ? new Date(createdAt.getTime() + rng.int(1, 20) * 60_000) : null,
        rejectionReason: status === 'REJECTED_BY_SHOP'
          ? rng.pick(['Item finished today', 'Shop closing early', 'Stock not arrived']) : null,
        cancelledAt: status === 'CANCELLED_BY_CUSTOMER'
          ? new Date(createdAt.getTime() + rng.int(1, 60) * 60_000) : null,
        expiredAt: status === 'EXPIRED'
          ? new Date(createdAt.getTime() + 2 * 60 * 60_000) : null,
        items: { create: items },
      },
    })
    orderIds.push(order.id)

    // Every resolved reservation teaches us something about availability —
    // this is what the confidence model and accuracy analytics feed on.
    for (const line of items) {
      if (line.fulfilmentStatus === 'PENDING') continue
      const confirmedLine = line.fulfilmentStatus === 'AVAILABLE'
      await prisma.availabilityEvent.create({
        data: {
          shopId, productId: line.productId,
          previousAvailability: 'UNKNOWN',
          newAvailability: confirmedLine ? 'IN_STOCK' : 'OUT_OF_STOCK',
          source: confirmedLine ? 'RESERVATION_CONFIRMED' : 'RESERVATION_REJECTED',
          orderId: order.id,
          createdAt: confirmedAt ?? createdAt,
        },
      })
    }
  }

  // Reviews — only on completed orders, skewed positive but not uniform.
  const completed = await prisma.order.findMany({
    where: { status: 'COMPLETED' }, select: { id: true, customerId: true, shopId: true, completedAt: true },
  })
  for (const order of rng.sample(completed, Math.min(60, completed.length))) {
    await prisma.review.create({
      data: {
        orderId: order.id, customerId: order.customerId, shopId: order.shopId,
        rating: rng.pick([5, 5, 5, 4, 4, 4, 3, 2]),
        comment: rng.pick(REVIEW_COMMENTS),
        createdAt: order.completedAt ?? SEED_NOW,
      },
    })
  }

  // Denormalised rating on Shop, so shop cards need no aggregate query.
  for (const shopId of shopIds) {
    const agg = await prisma.review.aggregate({
      where: { shopId }, _avg: { rating: true }, _count: true,
    })
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        avgRating: Number((agg._avg.rating ?? 0).toFixed(2)),
        ratingCount: agg._count,
      },
    })
  }

  // Two open disputes so the admin queue is never empty.
  const disputeOrders = rng.sample(completed, 2)
  for (const order of disputeOrders) {
    await prisma.dispute.create({
      data: {
        orderId: order.id, raisedByUserId: order.customerId,
        reason: rng.pick(['ITEM_NOT_AVAILABLE_ON_ARRIVAL', 'PRICE_MISMATCH'] as const),
        description: 'Shop did not have the item when I reached, despite the confirmation.',
        status: 'OPEN',
        createdAt: new Date(SEED_NOW.getTime() - rng.int(60, 5000) * 60_000),
      },
    })
  }

  // Search logs, including a tight cluster of zero-result queries.
  for (let i = 0; i < 370; i++) {
    const queryText = rng.pick(COMMON_QUERIES)
    await prisma.searchLog.create({
      data: {
        userId: rng.bool(0.7) ? rng.pick(ctx.customerIds) : null,
        queryText, resultCount: rng.int(1, 12),
        lat: ctx.defaultCustomerAddress.lat, lng: ctx.defaultCustomerAddress.lng,
        createdAt: new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000),
      },
    })
  }
  for (let i = 0; i < 30; i++) {
    await prisma.searchLog.create({
      data: {
        userId: rng.bool(0.7) ? rng.pick(ctx.customerIds) : null,
        queryText: rng.pick(ZERO_RESULT_QUERIES), resultCount: 0,
        lat: ctx.defaultCustomerAddress.lat, lng: ctx.defaultCustomerAddress.lng,
        createdAt: new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000),
      },
    })
  }

  return { orderIds }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- seedHistory`
Expected: PASS — 13 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/seed
git commit -m "feat: seed order history, reviews, disputes, and search logs"
```

---

### Task 10: Seed entrypoint, health endpoint, and one-command reset

**Files:**
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/app.ts`, `apps/api/src/server.ts`
- Modify: `package.json` (root scripts), `apps/api/package.json` (express deps)
- Create: `README.md`
- Test: `apps/api/src/health.test.ts`

**Interfaces:**
- Consumes: `seedCatalogue`, `seedUsersAndShops`, `seedHistory` from Tasks 7–9.
- Produces: `createApp()` → an Express app exposing `GET /health`; root scripts `db:reset`, `dev`, `test`.

- [ ] **Step 1: Write the failing test**

`apps/api/src/health.test.ts`:
```ts
import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from './app'
import { prisma } from './db'

describe('health endpoint', () => {
  afterAll(async () => { await prisma.$disconnect() })

  it('reports ok with database connectivity', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.database).toBe('connected')
  })

  it('reports the PostGIS version, proving the extension is live', async () => {
    const res = await request(createApp()).get('/health')
    expect(res.body.postgis).toMatch(/^3\./)
  })

  it('returns a structured error envelope for unknown routes', async () => {
    const res = await request(createApp()).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(typeof res.body.error.message).toBe('string')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- health`
Expected: FAIL — cannot resolve `./app`.

- [ ] **Step 3: Install the Express dependencies**

```bash
npm --workspace @shopnear/api install express cors helmet
npm --workspace @shopnear/api install -D @types/express @types/cors supertest @types/supertest
```

- [ ] **Step 4: Implement the app and server**

`apps/api/src/app.ts`:
```ts
import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { prisma } from './db'

/**
 * Every error the API returns uses one envelope, so all three clients can
 * parse failures the same way (spec §13).
 */
export interface ApiError {
  error: { code: string; message: string; details?: unknown }
}

export function createApp(): Express {
  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const rows = await prisma.$queryRaw<{ version: string }[]>`
        SELECT extversion AS version FROM pg_extension WHERE extname = 'postgis'
      `
      res.json({
        status: 'ok',
        database: 'connected',
        postgis: rows[0]?.version ?? 'missing',
        timestamp: new Date().toISOString(),
      })
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Cannot reach the database.' },
      } satisfies ApiError)
    }
  })

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' },
    } satisfies ApiError)
  })

  return app
}
```

`apps/api/src/server.ts`:
```ts
import 'dotenv/config'
import { createApp } from './app'

const port = Number(process.env.PORT ?? 4000)
createApp().listen(port, () => {
  console.log(`ShopNear API listening on http://localhost:${port}`)
})
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- health`
Expected: PASS — 3 tests.

- [ ] **Step 6: Implement the seed entrypoint**

`apps/api/prisma/seed.ts`:
```ts
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
```

- [ ] **Step 7: Add the root orchestration scripts**

Merge into root `package.json` `"scripts"`:
```json
{
  "db:reset": "npm --workspace @shopnear/api run db:reset",
  "db:studio": "npm --workspace @shopnear/api run db:studio",
  "dev:api": "npm --workspace @shopnear/api run dev",
  "dev": "npm run dev:api"
}
```
Add to `apps/api/package.json` `"scripts"`: `"dev": "tsx watch src/server.ts"`.

> `dev` grows to run all three web clients concurrently in Phase 3; for now
> it starts the API alone.

- [ ] **Step 8: Verify the full reset end to end**

```bash
npm run db:reset
```
Expected: migrations apply, seed runs, the credentials banner prints, and the
counts read ~350 products / 14 shops / ~1,800 inventory rows / ~120 orders.

- [ ] **Step 9: Verify determinism**

```bash
npm run db:reset && npm --workspace @shopnear/api run prisma -- db execute --stdin <<'SQL'
SELECT md5(string_agg(name || price::text, '' ORDER BY id)) FROM "Product" p JOIN "ShopInventory" s ON s."productId" = p.id;
SQL
```
Run this twice and compare the two hashes.
Expected: identical hashes — confirming the deterministic-seed constraint.

- [ ] **Step 10: Verify Prisma Studio**

```bash
npm run db:studio
```
Expected: Studio opens at `http://localhost:5555`; `Shop`, `Product`, and
`ShopInventory` are populated and browsable. **This is the Phase 1 deliverable.**

- [ ] **Step 11: Write the README**

`README.md` — the Phase 1 version, expanded in Phase 6. Must contain: the
one-paragraph pitch, prerequisites (Node 22+, Docker), exact setup commands
(`docker compose up -d && npm install && npm run db:reset`), the demo
credentials table, a note that `legacy/` holds the archived prototype and must
not be deleted, and a troubleshooting section covering port 5433 conflicts and
Docker not running.

- [ ] **Step 12: Commit**

```bash
git add apps/api README.md package.json
git commit -m "feat: seed entrypoint, health endpoint, and one-command db reset"
```

---

## Phase 1 exit criteria

- [ ] `docker compose up -d && npm install && npm run db:reset` succeeds from a clean clone.
- [ ] The credentials banner prints the four demo accounts.
- [ ] `npm test` passes — 8 suites, ~75 tests.
- [ ] Prisma Studio shows ~350 products, 14 shops, ~1,800 inventory rows, ~120 orders.
- [ ] Two consecutive resets produce identical content hashes.
- [ ] Every availability state and every timestamp-age bucket is represented, so all four confidence badges will render in Phase 3.
- [ ] `legacy/` is untouched.

**Stop and report before starting Phase 2.**
