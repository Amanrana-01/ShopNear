# ShopNear Phase 2 — API Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete REST API that all three web clients consume — auth for three roles, geospatial search with confidence-based availability, the enforced order state machine, and the virtual clock that makes time-travel demos possible.

**Architecture:** One Express + TypeScript service over the Phase 1 Prisma schema. Business logic lives in `modules/<domain>/<domain>.service.ts`, HTTP wiring in `<domain>.routes.ts`, and Zod contracts in `packages/shared` so clients import the same types. Every service that needs "now" calls `clock.now()`, never `Date.now()`. Socket.IO pushes reservation events to merchants and status changes to customers.

**Tech Stack:** Node 22 · TypeScript · Express · Prisma 6 · PostgreSQL 16 + PostGIS · Zod · argon2 · jsonwebtoken · Socket.IO · node-cron · Vitest + Supertest

**Spec:** `docs/superpowers/specs/2026-09-05-shopnear-design.md`

## Global Constraints

- **`clock.now()` everywhere.** No business code calls `Date.now()` or `new Date()` for current time. The clock reads a persisted offset so Phase 6 time-travel works retroactively across confidence badges, decay, and reservation expiry. (Spec R2)
- **Availability is never a number.** Enum + timestamp only. No stock counts in any response. (Spec §7)
- **Confidence badges** are computed from `availability` + age of `availabilityUpdatedAt` against `clock.now()`, per the spec §7 table exactly.
- **Role checks and ownership checks are separate.** A `CUSTOMER` token on a merchant route returns **403, never a redirect**. A `MERCHANT` may only read/mutate resources belonging to their **own** shop. (Spec §5)
- **One phone may hold both a customer and a merchant account** — `@@unique([phone, role])`. Auth must always resolve by (phone, role), never by phone alone.
- **Two merchants own two shops each** (12 merchants, 14 shops). Never write `findFirst({ where: { ownerId } })` — always handle the multi-shop case explicitly.
- **Illegal state transitions must throw**, and be covered by tests that assert the throw.
- **Error envelope** on every failure: `{ error: { code, message, details? } }`. No stack traces to clients.
- **Zod validation on every endpoint**, schemas exported from `packages/shared`.
- **Fully offline.** No paid APIs, no network calls.
- **OTP is always `123456`**, printed to the server console.
- **Never touch `legacy/`** — gitignored, only copy of an archived prototype's source.
- Database: `shopnear-db` on host port **5436**. Scripts use `dotenv -e ../../.env --`.
- Commit after every task.

---

### Task 1: Virtual clock and runtime config

**Files:**
- Create: `apps/api/src/clock/clock.ts`, `apps/api/src/config/runtimeConfig.ts`, `apps/api/src/config/constants.ts`
- Modify: `apps/api/prisma/schema.prisma` (add `AppSetting` model)
- Test: `apps/api/src/clock/clock.test.ts`, `apps/api/src/config/runtimeConfig.test.ts`

**Interfaces:**
- Produces: `clock.now(): Date`, `clock.advanceHours(n: number): Promise<void>`, `clock.reset(): Promise<void>`, `clock.getOffsetMs(): Promise<number>`
- Produces: `getRankingWeights()`, `setRankingWeights(w)`, `getDecayThresholds()`, `setDecayThresholds(t)` — all persisted, with defaults from `constants.ts`
- Produces: `AppSetting` model — `key String @id`, `value Json`, `updatedAt DateTime @updatedAt`

**Why this is Task 1:** every later task depends on `clock.now()`. Building it after the services would mean rewriting them.

- [ ] **Step 1: Write the failing clock test**

`apps/api/src/clock/clock.test.ts` — assert that:
- `clock.now()` with zero offset is within 2s of real time
- after `clock.advanceHours(30)`, `clock.now()` is ~30h ahead of real time
- the offset survives a fresh import (it is persisted in `AppSetting`, not module state)
- `clock.reset()` returns `now()` to real time
- `advanceHours` accumulates: two calls of 5h leave a 10h offset

- [ ] **Step 2: Run it, confirm it fails** — `npm test -- clock`

- [ ] **Step 3: Add the `AppSetting` model and migrate**

```prisma
/// Small key/value store for runtime-adjustable settings: the demo clock
/// offset, search ranking weights, and availability decay thresholds.
/// Persisted (not in-memory) so time-travel survives an API restart and so
/// the admin panel's sliders have somewhere to write.
model AppSetting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```
Run `npm --workspace @shopnear/api run db:migrate -- --name app_settings`.

- [ ] **Step 4: Implement `constants.ts`**

Defaults in one file so they can be changed live during a demo (spec R5):
```ts
export const DEFAULT_RANKING_WEIGHTS = {
  availabilityConfidence: 0.4, proximity: 0.3, shopRating: 0.2, isOpenNow: 0.1,
} as const

/** Hours. Drives both the badge table (spec §7) and the decay job. */
export const DEFAULT_DECAY_THRESHOLDS = {
  inStockFreshHours: 2,       // "In stock" -> "Likely available"
  inStockStaleHours: 24,      // "Likely available" -> "Usually available"
  outOfStockTrustHours: 12,   // "Out of stock" -> assume restocked
} as const

export const RESERVATION_EXPIRY_HOURS = 2
export const DEFAULT_SEARCH_RADIUS_M = 1000
export const ALLOWED_SEARCH_RADII_M = [250, 500, 1000, 3000] as const
```

- [ ] **Step 5: Implement `clock.ts`** — reads/writes `AppSetting` key `clock.offsetMs`, caches in memory with an invalidate-on-write, exposes the four functions above. Comment why it exists.

- [ ] **Step 6: Implement `runtimeConfig.ts`** — same pattern, keys `search.rankingWeights` and `availability.decayThresholds`, falling back to the constants when unset.

- [ ] **Step 7: Run tests, confirm pass. Commit.**

```bash
git commit -m "feat: virtual clock and persisted runtime config"
```

---

### Task 2: HTTP foundations — errors, validation, rate limiting

**Files:**
- Create: `apps/api/src/http/errors.ts`, `apps/api/src/http/validate.ts`, `apps/api/src/http/asyncHandler.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/http/errors.test.ts`, `apps/api/src/http/validate.test.ts`

**Interfaces:**
- Produces: `AppError` class with `code`, `httpStatus`, `message`, `details`; helpers `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`
- Produces: `validate({ body?, query?, params? })` Express middleware returning 400 with `details` listing field errors
- Produces: `asyncHandler(fn)` wrapper so async route errors reach the error middleware
- Produces: a terminal error middleware rendering `{ error: { code, message, details? } }` and logging the stack server-side only

- [ ] **Step 1: Write failing tests** — assert: a thrown `AppError` renders the envelope with its status; an unknown error renders `INTERNAL_ERROR` with a 500 and **no stack in the body**; `validate` rejects a bad body with 400 and per-field details; a valid body passes through and is coerced.
- [ ] **Step 2: Run, confirm failure.**
- [ ] **Step 3: Implement.** Add `express-rate-limit` on `/api/auth/*` (spec §13) — install it.
- [ ] **Step 4: Wire into `app.ts`** — keep `/health` working; mount `/api` router; error middleware last.
- [ ] **Step 5: Tests pass. Commit.**

---

### Task 3: Auth — OTP, passwords, JWT, and the two guards

**Files:**
- Create: `apps/api/src/modules/auth/auth.service.ts`, `auth.routes.ts`, `auth.types.ts`
- Create: `apps/api/src/http/authMiddleware.ts`
- Create: `packages/shared/src/schemas/auth.ts`
- Test: `apps/api/src/modules/auth/auth.test.ts`, `apps/api/src/http/authMiddleware.test.ts`

**Interfaces:**
- Produces endpoints:
  - `POST /api/auth/otp/request` `{ phone, role }` → `{ sent: true }`, logs `OTP for 9000000001: 123456` to console
  - `POST /api/auth/otp/verify` `{ phone, otp }` → customer tokens; creates the customer if new (`isNewUser: true`)
  - `POST /api/auth/customer/profile` (auth) `{ name, address }` → completes first-time setup
  - `POST /api/auth/merchant/login` `{ phone, password }` → merchant tokens
  - `POST /api/auth/admin/login` `{ email, password }` → admin tokens
  - `POST /api/auth/refresh` `{ refreshToken }` → new pair
  - `GET /api/auth/me` (auth) → the user plus, for merchants, **their shops as an array**
- Produces middleware: `requireAuth`, `requireRole(...roles)`, `requireShopOwnership(paramName)`
- Produces: `signTokens(user)` → `{ accessToken, refreshToken }`; access 15 min, refresh **30 days** (spec §5)

**Critical details:**
- OTP is always `123456` (constant `DEMO_OTP`), console-logged. Never stored.
- Customers have `passwordHash: null` and can never log in by password. Merchants/admin can never log in by OTP except the password-reset path.
- **Always look up by `(phone, role)`**, never phone alone.
- `requireRole` returns **403**, never a redirect.
- `requireShopOwnership` loads the shop and compares `shop.ownerId` to the token's user id — a **separate** check from role.

- [ ] **Step 1: Write failing tests.** Must include, at minimum:
  - customer OTP flow end to end, including auto-creating a new customer
  - wrong OTP → 401
  - merchant login with `demo1234` succeeds; with a wrong password → 401
  - admin login by email succeeds
  - **the same phone logging in as both customer and merchant returns two different user ids**
  - refresh token rotation works; an access token rejected on the refresh endpoint
  - **a `CUSTOMER` token on a merchant-only route → 403** (not 302, not 401)
  - **merchant A requesting merchant B's shop → 403** (cross-tenant)
  - a merchant who owns two shops sees both from `GET /api/auth/me`
- [ ] **Step 2-3: Run, fail, implement.** Install `jsonwebtoken`, `@types/jsonwebtoken`, `express-rate-limit`.
- [ ] **Step 4: Tests pass. Commit.**

---

### Task 4: Merchant registration

**Files:**
- Create: `apps/api/src/modules/merchants/registration.service.ts`, `registration.routes.ts`
- Create: `packages/shared/src/schemas/registration.ts`
- Test: `apps/api/src/modules/merchants/registration.test.ts`

**Interfaces:**
- Produces: `POST /api/merchants/register` — accepts the whole wizard payload in **one atomic transaction** creating `User` + `Shop` (status `PENDING`) + `Address` + starter `ShopInventory` rows, returning tokens plus the shop.
- Produces: `GET /api/merchants/starter-catalogue?shopType=KIRANA` → the curated list with suggested prices, for wizard step 7.
- Produces: `POST /api/merchants/uploads` — multer to a gitignored local dir, format validation only, returns a URL. **No verification is performed.**

**Critical details:**
- Wizard progress is client-side; the server sees one submit (spec R9). There is **no** `DRAFT` status.
- Shop is created `PENDING`. A `PENDING` merchant can read and edit their profile but **cannot receive orders** — enforce in the orders module, and test it.
- Reject a duplicate `(phone, MERCHANT)` with a clear 409.
- Password minimum 8 chars, argon2-hashed.

- [ ] **Step 1: Failing tests** — full registration succeeds and the shop is `PENDING` with its starter inventory attached; a duplicate merchant phone → 409; a customer account with the same phone is untouched; starter catalogue returns ~60 items for `KIRANA`; an upload of a disallowed type → 400.
- [ ] **Step 2-3: Run, fail, implement.** Install `multer`, `@types/multer`.
- [ ] **Step 4: Tests pass. Commit.**

---

### Task 5: Shops API and `isOpenNow`

**Files:**
- Create: `apps/api/src/modules/shops/shops.service.ts`, `shops.routes.ts`, `openingHours.ts`
- Create: `packages/shared/src/schemas/shops.ts`
- Test: `apps/api/src/modules/shops/shops.test.ts`, `openingHours.test.ts`

**Interfaces:**
- Produces: `computeIsOpenNow(openingHours, now)` → boolean — **computed, never stored** (spec R3)
- Produces:
  - `GET /api/shops/nearby?lat&lng&radius&type?` → active shops within radius, each with `distanceMeters` and `isOpenNow`, ordered by distance
  - `GET /api/shops/:id` → detail with inventory summary
  - `PATCH /api/shops/:id` (merchant, ownership) → profile and hours
  - `GET /api/shops/:id/inventory?query&page` → paginated
  - `PUT /api/shops/:id/inventory` (merchant, ownership) → bulk upsert prices/availability, writing `AvailabilityEvent` rows
  - `POST /api/shops/:id/inventory/copy-from/:otherShopId` (merchant, ownership) → the demo onboarding shortcut

**Critical details:**
- Radius query uses **PostGIS `ST_DWithin` on the GIST-indexed geography column** via `$queryRaw` — not Haversine in JS. Only `ACTIVE` shops appear to customers.
- `isOpenNow` honours `isTemporarilyClosed` and uses `clock.now()`.
- Every inventory write records an `AvailabilityEvent` with `MERCHANT_MANUAL`.

- [ ] **Step 1: Failing tests** — nearby at the anchor with radius 150 returns **≥3 shops** including `Shreeji Kirana`; radius 250 returns more than radius 150; `PENDING`/`SUSPENDED` shops never appear; distances match PostGIS within 1 m; `isOpenNow` true inside hours, false outside, false when temporarily closed; a merchant editing another merchant's shop → 403.
- [ ] **Step 2-4: Run, fail, implement, pass. Commit.**

---

### Task 6: Availability confidence and single-item search

**Files:**
- Create: `apps/api/src/modules/availability/confidence.ts`
- Create: `apps/api/src/modules/search/search.service.ts`, `search.routes.ts`, `ranking.ts`
- Create: `packages/shared/src/schemas/search.ts`
- Test: `confidence.test.ts`, `search.test.ts`, `ranking.test.ts`

**Interfaces:**
- Produces: `computeBadge(availability, updatedAt, now, thresholds)` → `{ label, tone, detail }` where `label` is one of `In stock | Likely available | Usually available | Out of stock | Ask the shop`
- Produces: `scoreResult({ confidence, distanceM, radiusM, rating, isOpenNow }, weights)` → number
- Produces: `GET /api/search?q&lat&lng&radius&page` → ranked results, each with shop, product, price, badge, distance — and **writes a `SearchLog` row every time**, including zero-result searches

**Critical details — the confidence table is the intellectual core, implement it exactly (spec §7):**

| Condition | Badge |
|---|---|
| `IN_STOCK`, < 2 h | **In stock** (green) + "confirmed N min ago" |
| `IN_STOCK`, 2–24 h | **Likely available** |
| `IN_STOCK`, > 24 h | **Usually available** |
| `USUALLY_AVAILABLE` | **Usually available** |
| `OUT_OF_STOCK`, < 12 h | **Out of stock** |
| `OUT_OF_STOCK`, > 12 h | **Usually available** (assume restocked) |
| `UNKNOWN` / no record | **Ask the shop** (reserve still allowed) |

- Thresholds come from `runtimeConfig`, not hard-coded, so the admin panel can move them live.
- Matching combines `Product.searchKeywords` array containment **and** `pg_trgm` similarity on `Product.name`, so "atta", "aata", "ata" and "ghau no lot" all find wheat flour.
- Ranking is the weighted composite, weights from `runtimeConfig`.
- **Never emit a stock count.**

- [ ] **Step 1: Failing tests.** Confidence: one test per row of the table above, using a fixed `now` — including the non-obvious "out of stock but stale → usually available" case. Search: "atta" at the anchor returns **≥4 distinct shops**; "aata" and "ata" return the same product set; results carry differing badges; a zero-result query writes a `SearchLog` with `resultCount: 0`; changing ranking weights changes the order.
- [ ] **Step 2-4: Run, fail, implement, pass. Commit.**

---

### Task 7: Multi-item search

**Files:**
- Create: `apps/api/src/modules/search/multiSearch.service.ts`
- Test: `apps/api/src/modules/search/multiSearch.test.ts`

**Interfaces:**
- Produces: `POST /api/search/multi` `{ items: string[], lat, lng, radius }` → `{ bestShop: { shop, covered[], missing[] }, split: [{ shop, covered[] }, { shop, covered[] }] }`

**Critical details:** This is the headline differentiator versus quick-commerce (spec §8). For each shop in radius, count how many of the requested items it can supply; return the single best, plus a greedy two-shop split covering the most items overall.

- [ ] **Step 1: Failing tests** — a 5-item list resolves to the shop covering the most, `missing` lists the rest, the two-shop split covers at least as many as the best single shop, and an item nobody stocks appears in `missing` and is logged as a zero-result search.
- [ ] **Step 2-4: Run, fail, implement, pass. Commit.**

---

### Task 8: Order state machine

**Files:**
- Create: `apps/api/src/modules/orders/stateMachine.ts`, `orders.service.ts`, `orders.routes.ts`
- Create: `packages/shared/src/schemas/orders.ts`
- Test: `stateMachine.test.ts`, `orders.test.ts`

**Interfaces:**
- Produces: `assertTransition(from, to, orderType)` — **throws on any illegal transition**
- Produces: `LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`
- Produces endpoints: create order; merchant resolves line items then confirms; ready; out-for-delivery; complete (with pickup code); customer cancel; merchant reject (with reason)

**The machine (spec §6) — implement exactly:**
```
PLACED     → CONFIRMED | REJECTED_BY_SHOP | CANCELLED_BY_CUSTOMER | EXPIRED
CONFIRMED  → READY_FOR_PICKUP | OUT_FOR_DELIVERY | CANCELLED_BY_CUSTOMER
READY_FOR_PICKUP → COMPLETED
OUT_FOR_DELIVERY → COMPLETED        (DELIVERY type only)
COMPLETED / REJECTED_BY_SHOP / CANCELLED_BY_CUSTOMER / EXPIRED → terminal
```

**Critical details:**
- `PLACED → CONFIRMED` requires every line item marked `AVAILABLE`, `UNAVAILABLE` or `SUBSTITUTED`. **If every item is unavailable, the order goes to `REJECTED_BY_SHOP` instead.**
- Partial availability recalculates the total and notifies the customer.
- For `RESERVE_AND_COLLECT`, `CONFIRMED` **auto-advances** to `READY_FOR_PICKUP` once items are resolved (spec R4).
- `COMPLETED` on a pickup order **requires the correct 4-digit `pickupCode`** — wrong code returns 400 and does not transition.
- `OUT_FOR_DELIVERY` is rejected for `RESERVE_AND_COLLECT` orders.
- Every resolution writes an `AvailabilityEvent`: available → `IN_STOCK`/`RESERVATION_CONFIRMED`; unavailable → `OUT_OF_STOCK`/`RESERVATION_REJECTED`, and updates the matching `ShopInventory`.
- Orders may only be placed at **`ACTIVE`** shops — a `PENDING` shop must reject with 409.
- `expiresAt` = `clock.now()` + `RESERVATION_EXPIRY_HOURS`.
- `orderNumber` is sequential and human-readable (`SN-####`); `pickupCode` is 4 random digits.

- [ ] **Step 1: Failing tests — this is the most important test file in the phase.**
  - one passing test per legal transition
  - **one throwing test per illegal transition** (e.g. `PLACED → COMPLETED`, `COMPLETED → CONFIRMED`, `EXPIRED → CONFIRMED`, `OUT_FOR_DELIVERY` on a pickup order)
  - all-items-unavailable lands in `REJECTED_BY_SHOP`, not `CONFIRMED`
  - partial availability recalculates the total correctly
  - a wrong pickup code returns 400 and leaves status unchanged
  - confirming writes the expected `AvailabilityEvent` rows and flips `ShopInventory.availability`
  - **cross-tenant: merchant B cannot act on merchant A's order → 403**
  - ordering from a `PENDING` shop → 409
- [ ] **Step 2-4: Run, fail, implement, pass. Commit.**

---

### Task 9: Reviews, disputes, realtime, and scheduled jobs

**Files:**
- Create: `apps/api/src/modules/reviews/`, `apps/api/src/modules/disputes/`
- Create: `apps/api/src/realtime/io.ts`
- Create: `apps/api/src/jobs/decay.job.ts`, `expiry.job.ts`, `index.ts`
- Test: `reviews.test.ts`, `disputes.test.ts`, `decay.job.test.ts`, `expiry.job.test.ts`

**Interfaces:**
- Produces: review CRUD (one per order, **COMPLETED only**), recomputing `Shop.avgRating`/`ratingCount`
- Produces: dispute raise/list/resolve (admin)
- Produces: `initRealtime(server)` — JWT-authenticated Socket.IO; merchants join `shop:<id>`, customers join `order:<id>`; emits `order:new`, `order:updated`
- Produces: `runDecayJob()` and `runExpiryJob()` — exported so the demo panel and tests can invoke them directly, plus hourly `node-cron` registration

**Critical details:**
- Decay uses `clock.now()` and the runtime thresholds, moves stale `IN_STOCK`/`OUT_OF_STOCK` toward `USUALLY_AVAILABLE`, and writes `AUTO_DECAY` events. **Time-travelling 30 h then running decay must visibly change badges** — test exactly that.
- Expiry moves `PLACED` orders past `expiresAt` to `EXPIRED`.
- Reviews on non-completed orders → 400. A second review on the same order → 409.

- [ ] **Step 1: Failing tests**, including: advance the clock 30 h, run decay, and assert a specific inventory row's badge changed from "In stock" to "Usually available" and an `AUTO_DECAY` event was written; expiry only touches `PLACED` orders past their expiry.
- [ ] **Step 2-4: Run, fail, implement, pass. Commit.** Install `socket.io`, `node-cron`.

---

### Task 10: OpenAPI, Swagger UI, and the integration sweep

**Files:**
- Create: `docs/api.yaml`
- Modify: `apps/api/src/app.ts` (mount Swagger UI at `/api/docs`)
- Test: `apps/api/src/integration/journey.test.ts`, `apps/api/src/integration/security.test.ts`

**Interfaces:**
- Produces: OpenAPI 3 spec covering every endpoint, served at `/api/docs`

- [ ] **Step 1: Write the two integration suites.**
  - `journey.test.ts` — the full demo path in one test: customer requests OTP → verifies → searches "atta" → sees ≥4 shops with differing badges → reserves from the nearest → gets a pickup code → merchant sees the order → confirms items → status reaches `READY_FOR_PICKUP` → merchant completes with the pickup code → customer reviews → shop rating updates.
  - `security.test.ts` — a table-driven sweep asserting **every** merchant route rejects a customer token with 403, **every** admin route rejects a merchant token with 403, and merchant A is refused on merchant B's shop, inventory, and orders.
- [ ] **Step 2-3: Run, fail, implement any gaps.**
- [ ] **Step 4: Write `docs/api.yaml`** documenting every endpoint, then mount `swagger-ui-express`.
- [ ] **Step 5: Verify** `GET /api/docs` renders and `npm test` passes fully. Commit.

---

## Phase 2 exit criteria

- [ ] `npm test` passes; the state-machine suite proves illegal transitions throw.
- [ ] Customer OTP, merchant password, and admin email logins all work; one phone holds two accounts.
- [ ] `GET /api/search?q=atta` at the anchor returns ≥4 shops with differing badges and prices in **under 300 ms**.
- [ ] Multi-item search identifies the best single shop from a 5-item list.
- [ ] A reservation can be placed, confirmed, and completed with its pickup code, writing `AvailabilityEvent` rows.
- [ ] Advancing the clock 30 h and running decay visibly degrades badges.
- [ ] Every merchant route 403s a customer token; merchant A cannot touch merchant B's data.
- [ ] Swagger UI renders at `/api/docs`.

**Stop and report before starting Phase 3.**
