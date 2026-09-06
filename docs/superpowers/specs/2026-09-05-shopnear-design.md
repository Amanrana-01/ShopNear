# ShopNear — Design Specification

**Status:** Approved (brief + Amendment 1 + resolutions from brainstorming)
**Date:** 2026-09-05
**Source:** ShopNear Agent Build Brief, as amended by Amendment 1.

This document is the authoritative working copy of the brief. Where it
differs from the original brief text, this document wins — every such
difference is listed in §2 with its reason.

---

## 1. Product summary

ShopNear is a hyperlocal discovery-and-reservation platform for neighbourhood
retail shops (kirana, general, stationery, hardware, chemist, bakery, dairy,
farsan, vegetable) in a seeded Ahmedabad neighbourhood.

A customer searches for an item and sees which nearby shops carry it, at what
price, and **how recently that was confirmed**. The primary transaction is
*reserve and collect*: the shop holds the item, the customer walks over and pays
in person. Delivery is a secondary, opt-in flow fulfilled by the shop's own
delivery person.

**The core design commitment:** we never promise a live stock count, because
small shops cannot maintain one. We promise a *fast confirmation*. The
shopkeeper answers "Have it / Don't have it" with one tap, and that answer is
what updates availability. Availability is modelled as a **confidence level
with a timestamp**, never as a hard number. No numeric stock count appears
anywhere in the customer UI.

**Constraints that shape everything:**

- Demo data only. No real shops, merchants, customers, or money.
- Must run fully offline on a laptop after `npm install`, with one command.
- No paid third-party APIs, no live payment gateway, no account signup required.
- Every feature must be demonstrable by clicking through the UI in under
  60 seconds. A feature that exists only in the database is not done.
- Code must be defensible by a final-year student in a viva: conventional over
  clever, with the non-obvious parts commented.

---

## 2. Resolutions — where this spec departs from the original brief

Each item was raised during brainstorming and explicitly approved.

| # | Issue in the brief | Resolution |
|---|---|---|
| R1 | Brief assumed a greenfield repo; the repo already held an Express+MySQL / Next.js / Expo prototype. | Prototype archived, not deleted. Files preserved on disk under `legacy/` (gitignored); the backend's committed history is on branch `legacy/nextjs-express-prototype`. **`legacy/web` and `legacy/mobile` were submodule gitlinks whose source was never committed — `legacy/` is the only copy of that source. Do not delete it.** |
| R2 | Time travel was specified as a Phase 6 demo add-on, but it is cross-cutting: confidence display, the decay job, and reservation expiry all read "now". | A single `clock` service (backed by a settings row holding an offset) is built in **Phase 2** and used by all business logic from day one. No business code calls `Date.now()` directly. |
| R3 | `Shop.isOpenNow` was listed as a model field but depends on `openingHours` + current time. | Not a stored column. Computed in the service layer from `openingHours` and `clock.now()`. |
| R4 | The state diagram gives no trigger for `CONFIRMED → READY_FOR_PICKUP`; no "packing" step exists elsewhere. | For `RESERVE_AND_COLLECT`, `CONFIRMED` auto-advances to `READY_FOR_PICKUP` once all line items are resolved. Preserves the one-tap, sub-8-second merchant confirm. |
| R5 | §5.2 wants decay thresholds as constants in one file; §5.5 wants admin-adjustable sliders. | Constants file supplies defaults, loaded into a runtime config row the admin panel overrides. Both satisfied. |
| R6 | PostGIS was flagged as possibly painful, with a Haversine fallback offered. | Docker 29.1.3 + Compose v5.0.1 are installed; PostGIS runs in a container. **Use real PostGIS.** Fall back to Haversine only if it genuinely blocks setup, and document the trade-off if so. |
| R7 | Amendment 1 requires one phone to hold both a customer and a merchant account, contradicting `User.phone (unique)`. | Uniqueness scoped to `@@unique([phone, role])`. Same phone may exist once as `CUSTOMER` and once as `MERCHANT`, never twice within a role. |
| R8 | Amendment 1 adds email+password admin login, but `User` had no email field. | Add `email String? @unique` — set for admin, available for merchant password reset, null for customers. |
| R9 | Amendment 1 asks the merchant wizard to "save progress after every step". | Wizard state persists **client-side in `localStorage`**; final submit on step 7 atomically creates User + Shop + Address + starter inventory in one transaction. No `DRAFT` shop status, no partial-save endpoints. |
| R10 | Amendment 1 step 7 needs to know which products are "common" per shop type. | Dedicated `StarterCatalogueItem(shopType, productId, suggestedPrice)` table, seeded per shop type — curated and demo-reliable, independent of category structure. |
| R11 | Amendment 1 step 6 uploads verification documents. | Stored locally via multer to a gitignored `apps/api/uploads/`, served statically. Format validation only. **No verification is performed** — UI shows a "Demo — not verified" notice, and `future-scope.md` records the limitation. |

---

## 3. Architecture

**Monorepo** via npm workspaces. One API serves three separate React clients.

```
apps/api            Express + TypeScript + Prisma        :4000
apps/web-customer   React + Vite + TypeScript            :5173
apps/web-merchant   React + Vite + TypeScript            :5174
apps/web-admin      React + Vite + TypeScript            :5175
packages/shared     Zod schemas + shared types, imported by API and all clients
```

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, React Router, TanStack Query |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 + PostGIS |
| Auth | JWT access + refresh, roles `CUSTOMER` / `MERCHANT` / `ADMIN` |
| Realtime | Socket.IO |
| Validation | Zod, shared client/server via `packages/shared` |
| Testing | Vitest (units), Supertest (API routes) |
| Dev orchestration | Docker Compose for Postgres/PostGIS; apps run on the host |

**Three separate clients, not one app with a role switch.** Each has its own
route guard redirecting to its own login. A shared `RoleGate` component lives in
`packages/shared`. Cross-links are one-liners ("Are you a shop owner? Register
your shop"), never a combined login form with a role dropdown — two clean entry
points prevent wrong-side confusion during the demo.

---

## 4. Data model

Prisma. The **global-catalogue / per-shop-inventory split is the heart of the
design** and must be preserved: `Product` is the shared master catalogue;
`ShopInventory` is what makes a product real, priced, and available in one
specific shop.

### User
`id`, `name`, `phone`, `email String? @unique`, `role`, `passwordHash String?`
(null for customers; set for merchants/admin), `defaultAddressId`,
`preferredLanguage` (`en` | `hi` | `gu`), `createdAt`.
**`@@unique([phone, role])`** — see R7.

### Address
`id`, `userId → User`, `label` (Home/Work/Other), `line1`, `line2`, `landmark`,
`city`, `pincode`, `lat`, `lng`.

`User.defaultAddressId` and `Address.userId` reference each other; the former is
a nullable FK, so there is no cycle problem.

### Shop
`id`, `ownerId → User`, `name`, `nameGu`, `type` (`KIRANA`, `GENERAL`,
`STATIONERY`, `HARDWARE`, `CHEMIST`, `BAKERY`, `DAIRY`, `FARSAN`, `VEGETABLE`),
`description`, `phone`, `address`, `lat`, `lng`, `location` (PostGIS geography
point, GIST-indexed), `status` (`PENDING`, `ACTIVE`, `SUSPENDED`),
`openingHours` (JSON: per-weekday open/close + `isTemporarilyClosed`),
`acceptsDelivery`, `deliveryRadiusMeters`, `minOrderValue`, `deliveryFee`,
`avgRating`, `ratingCount`, `bannerImageUrl` (doubles as shop photo),
`licenceNumber String?`, `licenceDocUrl String?` (both mock — see R11),
`createdAt`.

`isOpenNow` is **computed, not stored** (R3).

### Category
`id`, `name`, `nameGu`, `slug`, `iconName`, `parentId` (self-relation, two
levels max).

### Product — global master catalogue
`id`, `name`, `nameGu`, `brand`, `categoryId`, `unitType` (`PIECE`, `WEIGHT`,
`VOLUME`, `PACK`), `defaultUnitLabel` (e.g. "500 g", "1 L", "per kg"),
`mrp` (nullable — loose goods have none), `barcode` (nullable, unique when
present), `imageUrl`, `searchKeywords String[]`, `isLooseGood`.

`searchKeywords` **must** include Hindi/Gujarati transliterations — e.g. wheat
flour: `["atta","aata","lot","ghau no lot","wheat flour"]`. Seed generously;
search quality depends on it.

### ShopInventory
`id`, `shopId`, `productId`, `price`, `availability` (`IN_STOCK`,
`OUT_OF_STOCK`, `USUALLY_AVAILABLE`, `UNKNOWN`), `availabilityUpdatedAt`,
`availabilitySource` (`MERCHANT_MANUAL`, `RESERVATION_CONFIRMED`,
`RESERVATION_REJECTED`, `SEED`, `AUTO_DECAY`), `confirmCount`, `rejectCount`,
`notes`, `isActive`. **`@@unique([shopId, productId])`**.

### StarterCatalogueItem (R10)
`id`, `shopType`, `productId`, `suggestedPrice`. Curated per shop type, ~60
items each, powering wizard step 7.

### Order — covers reservations and deliveries
`id`, `orderNumber` (human-readable, e.g. `SN-2401`), `customerId`, `shopId`,
`type` (`RESERVE_AND_COLLECT` | `DELIVERY`), `status`, `subtotal`,
`deliveryFee`, `total`, `paymentMode` (`CASH_ON_PICKUP`, `CASH_ON_DELIVERY`,
`MOCK_ONLINE`), `paymentStatus`, `deliveryAddressId String?`, `customerNote`,
`merchantNote`, `rejectionReason`, `pickupCode` (4-digit, shown to customer,
verified by merchant), `expiresAt` (reservations expire; default 2 hours),
timestamps per status transition.

### OrderItem
`id`, `orderId`, `productId`, `productNameSnapshot`, `unitLabelSnapshot`,
`quantity`, `unitPrice`, `lineTotal`, `fulfilmentStatus` (`PENDING`,
`AVAILABLE`, `UNAVAILABLE`, `SUBSTITUTED`), `substituteProductId String?`.

**Snapshot name and price — never join to live data for historical orders.**

### Review
`id`, `orderId` (unique), `customerId`, `shopId`, `rating` (1–5), `comment`,
`createdAt`.

### Dispute
`id`, `orderId`, `raisedByUserId`, `reason` (`ITEM_NOT_AVAILABLE_ON_ARRIVAL`,
`PRICE_MISMATCH`, `QUALITY_ISSUE`, `SHOP_CLOSED`, `OTHER`), `description`,
`status` (`OPEN`, `RESOLVED`, `REJECTED`), `adminNote`, `resolvedAt`.

### AvailabilityEvent — append-only audit log
`id`, `shopId`, `productId`, `previousAvailability`, `newAvailability`,
`source`, `orderId String?`, `createdAt`.

Powers the confidence feature and the analytics dashboard.

### SearchLog
`id`, `userId String?`, `queryText`, `resultCount`, `lat`, `lng`, `createdAt`.
Powers the unmet-demand report.

### Indexes
`ShopInventory(shopId, productId)`, `ShopInventory(productId, availability)`,
GIST on `Shop.location`, trigram (`pg_trgm`) on `Product.name`.

---

## 5. Accounts, registration and login (Amendment 1 §5.0)

Two public account types — customer and shopkeeper — plus an internal admin.
Separate apps, separate entry points. One phone may hold both a customer and a
merchant account as **distinct `User` rows** (R7), never one user with two roles.

**Customer signup/login** (`/`, customer app)
Phone → OTP. OTP is always `123456`, printed to the server console and shown in
a dismissible dev banner. First-time users then set a display name and add one
address (map pin + manual fields). Location permission is requested here; if
denied, fall back to manual pin placement or a preset demo location. No
password, no email. Target: home feed in under 20 seconds.

**Shopkeeper signup** (`/register`, merchant app)
A guided seven-step wizard; progress saved client-side after each step (R9).

1. **Owner details** — name, phone, OTP verification, password (min 8 chars),
   preferred language. *Language is chosen first* so the rest of the wizard
   renders in Gujarati/Hindi if selected.
2. **Shop details** — name (English + Gujarati), type, description, contact number.
3. **Location** — draggable map pin + address fields, landmark, pincode.
   Warn if the pin is more than 200 m from the typed address.
4. **Timings** — per-weekday open/close, weekly off day. Offer presets
   ("9 AM – 9 PM, open all days") to avoid 14 dropdowns.
5. **Fulfilment** — reserve-and-collect always on; delivery is an opt-in toggle
   revealing radius, minimum order value, and delivery fee.
6. **Verification documents** — shop photo + mock GST/Udyam/licence number.
   Format validation only, no verification performed, "Demo — not verified"
   notice shown (R11).
7. **Starter inventory** — bulk-add a suggested catalogue for the chosen shop
   type (~60 items) with editable prices, so a new shop is not empty on day one.
   Addresses cold-start; must be demonstrable.

On submit the shop is created with `status = PENDING`. The merchant lands on a
pending-approval screen explaining what happens next; they may edit their
profile but cannot receive orders. Admin approval flips the shop to `ACTIVE` and
unlocks the dashboard.

**Shopkeeper login** (`/login`, merchant app) — phone + password, OTP as
password-reset fallback. 30-day refresh token.

**Admin login** — email + password at a separate route, not linked from either
public app.

**Role enforcement**
- JWTs carry `role`; Express middleware guards every route. A `CUSTOMER` token
  hitting a merchant endpoint returns **`403`, never a redirect**.
- **Ownership checks are separate from role checks.** A `MERCHANT` may only read
  or mutate resources belonging to their own shop. Cross-tenant tests are
  mandatory: merchant A reading merchant B's orders must fail.

---

## 6. Order state machine

Enforced explicitly in the service layer. **Illegal transitions must throw.**
Diagram belongs in `/docs`.

```
                    ┌──────────────► CANCELLED_BY_CUSTOMER
                    │                (allowed from PLACED, CONFIRMED)
PLACED ──────────► CONFIRMED ──────► READY_FOR_PICKUP ──────► COMPLETED
   │                   │                                          ▲
   │                   └──────────► OUT_FOR_DELIVERY ─────────────┘
   │                                (DELIVERY type only)
   ├──────────► REJECTED_BY_SHOP    (with reason)
   │
   └──────────► EXPIRED             (auto, when expiresAt passes with no action)
```

- `PLACED → CONFIRMED` requires the merchant to mark each line item
  `AVAILABLE`, `UNAVAILABLE`, or `SUBSTITUTED`. If **every** item is
  unavailable, the order goes to `REJECTED_BY_SHOP` instead.
- Partial availability is allowed: the customer is notified, the total is
  recalculated, and the customer may cancel within a grace period.
- `CONFIRMED → READY_FOR_PICKUP` auto-fires for `RESERVE_AND_COLLECT` once all
  items are resolved (R4).
- `COMPLETED` for a pickup order requires the merchant to enter the customer's
  4-digit `pickupCode`.
- `EXPIRED` fires from `PLACED` via a scheduled job reading `clock.now()`.
- Every relevant transition writes an `AvailabilityEvent`: a confirmed item
  becomes `IN_STOCK` / `RESERVATION_CONFIRMED`; an unavailable item becomes
  `OUT_OF_STOCK` / `RESERVATION_REJECTED`.

---

## 7. The availability confidence model

**The intellectual core of the project.** Display label is computed from
`availability` plus the age of `availabilityUpdatedAt`, measured against
`clock.now()` (R2).

| Condition | Badge shown to customer |
|---|---|
| `IN_STOCK`, updated < 2 h ago | **In stock** (green) — "confirmed 20 min ago" |
| `IN_STOCK`, updated 2–24 h ago | **Likely available** (green-amber) |
| `IN_STOCK`, updated > 24 h ago | **Usually available** (amber) |
| `USUALLY_AVAILABLE` | **Usually available** (amber) — "this shop normally stocks this" |
| `OUT_OF_STOCK`, updated < 12 h ago | **Out of stock** (red) |
| `OUT_OF_STOCK`, updated > 12 h ago | **Usually available** (amber) — assume restocked |
| `UNKNOWN` or no record | **Ask the shop** (grey) — reserve still allowed |

An hourly `node-cron` job decays stale `IN_STOCK` / `OUT_OF_STOCK` records
toward `USUALLY_AVAILABLE`, writing `AUTO_DECAY` events. Thresholds are
constants in one file, overridable at runtime from the admin panel (R5), so they
can be changed live during a demo.

**Never display a numeric stock count in the customer UI.**

---

## 8. Search and discovery

- **Location-first.** Results are always scoped to shops within a radius
  (default 1000 m; user-adjustable 250 m / 500 m / 1 km / 3 km).
- **Composite ranking, not distance alone:**
  `w1·availabilityConfidence + w2·proximity + w3·shopRating + w4·isOpenNow`.
  Weights live in a config file and are exposed as admin-panel sliders — a
  strong live-demo moment.
- **Transliteration and typo tolerance.** Match `Product.searchKeywords` and use
  `pg_trgm` similarity so "aata", "atta", and "ata" all find wheat flour.
- **Multi-item search** — the customer pastes a list ("atta, doodh, Maggi,
  sabun") and ShopNear shows which single nearby shop fulfils the most items,
  plus a fallback split across two shops. Headline differentiator versus
  quick-commerce.
- **Empty results** log to `SearchLog` and show a "Request this item" button
  that notifies nearby shops.

---

## 9. Merchant experience

Optimised ruthlessly for speed and low English literacy.

- **Incoming reservation screen:** full-screen card, product images, large
  *Have it* / *Don't have it* buttons per line item, one *Confirm order* button.
  **Target: under 8 seconds to respond.**
- Audible alert + browser notification on a new order; live countdown to `expiresAt`.
- **Bulk inventory:** search the master catalogue, tick products, set prices in
  one table. Plus "copy inventory from a similar shop" for fast demo onboarding.
- **Barcode scan (simulated):** `@zxing/browser` reads a real barcode from a
  printed sheet, matched against seeded `Product.barcode`. Text-input fallback
  when no camera. Printable sheet at `/docs/demo-barcodes.pdf`.
- **Language toggle** (English / हिन्दी / ગુજરાતી) in the header, applied app-wide.
- **Daily summary:** orders received / confirmed / rejected, estimated value,
  most-requested item not in inventory.

---

## 10. Admin panel

- Shop approval queue (approve/reject).
- Master catalogue CRUD **including a merge-duplicates tool** — two merchants
  adding "Amul Butter 500g" and "amul butter 500 gm" is a real failure mode;
  build the fix and show it.
- Order explorer with filters; dispute queue with resolution.
- **Analytics (Recharts):** orders per day, confirmation rate per shop, median
  merchant response time, top zero-result searches (unmet demand), availability
  accuracy rate.
- Ranking-weight sliders (§8) and decay-threshold controls (§7).

---

## 11. Seed data

Deterministic — fixed RNG seed, identical on every reset. Lives at
`apps/api/prisma/seed.ts`, exposed as `npm run db:reset`.

**Geography.** Centred near Navrangpura, Ahmedabad (**23.0365, 72.5611**), with
shops scattered 40 m – 2.5 km out. **At least three shops within 150 m of the
default customer address**, so the "shop next door" story lands immediately.

**Volume**
- 1 admin, 12 merchants, 8 customers.
- **14 shops:** 5 kirana, 2 general, 1 each stationery / hardware / chemist /
  bakery / dairy / farsan / vegetable cart. **Two `PENDING`** (so the approval
  queue isn't empty), **one `SUSPENDED`**.
- ~40 categories across two levels (Groceries → Flours & Grains, Dairy → Milk &
  Curd, …).
- **~350 products** weighted toward realistic Indian retail: Amul, Britannia,
  Parle, Tata, Aashirvaad, Nirma, Surf Excel, Colgate, Maggi, Everest/MDH, plus
  loose goods (toor dal, chana dal, rice, jaggery, seasonal vegetables), plus
  non-grocery for hardware / stationery / chemist. **Every product needs
  Gujarati/Hindi search keywords.**
- **~1,800 `ShopInventory` rows** — 80–200 products per shop, overlapping but not
  identical, prices varying ±8% between shops for the same product.
  **Deliberately spread availability states and `availabilityUpdatedAt` from
  5 minutes to 9 days ago, so every confidence badge appears somewhere.**
- **~120 historical orders** over the past 30 days across all terminal states,
  so analytics have shape. Include **2 open disputes**.
- ~60 reviews, skewed positive but not uniform.
- ~400 search logs including **30 zero-result searches clustered on a few
  items**, so unmet-demand has a clear story.
- `StarterCatalogueItem` rows per shop type (~60 each).

**Images.** No hotlinking. Commit small local placeholders or generate coloured
SVG placeholders bearing the product initial. **The app must look correct with
no internet.**

**Demo accounts** — printed to console after seeding, listed in the README:

```
Customer : 9000000001 / OTP 123456
Merchant : 9000000010 / password: demo1234   (Shreeji Kirana, 80 m away)
Merchant : 9000000011 / password: demo1234   (Patel General Store, 340 m away)
Admin    : admin@shopnear.local / password: admin1234
```

---

## 12. Demo & simulation mode

A **Demo Control Panel** at `/demo`, dev-only. Because no real merchants are
clicking buttons, this exists so **one person can present the whole system
convincingly**. It is a first-class, graded feature.

- **Auto-merchant toggle** — a background worker responds to new reservations
  after a configurable delay (default 8 s), confirming ~80% of items and
  rejecting the rest, so a solo presenter can show the full customer journey
  without switching accounts.
- **Time travel** — advance the app's "now" by N hours and re-run the decay job,
  demonstrating confidence badges degrading live. Depends on the `clock` service (R2).
- **Simulated traffic** — fire 5–20 fake orders so analytics visibly move.
- **Location spoofing** — preset customer locations ("Home — 80 m from Shreeji
  Kirana", "Office — 2 km away", "Outside coverage") to demo radius behaviour
  without GPS.
- **Scenario buttons** — one click each: happy-path pickup, partial
  availability, shop rejects, reservation expires, customer raises dispute.
- **Reset database** — back to seeded state in under 10 seconds.

Guarded behind `NODE_ENV !== 'production'` **and** `DEMO_MODE=true`.

---

## 13. Non-functional requirements

- **Responsive:** customer and merchant apps usable at **390 × 844 px**.
  Mobile-first; desktop secondary.
- **i18n:** English, Hindi, Gujarati via i18next. Full coverage in the merchant
  app; customer app at minimum for navigation, buttons, status labels. Fall back
  to English for product names lacking a translation.
- **Accessibility:** semantic HTML, keyboard navigable, visible focus rings,
  WCAG AA contrast. **Availability status must never be conveyed by colour
  alone** — always colour + text label + icon.
- **Performance:** search results in **under 300 ms** on seeded data, backed by
  the indexes in §4.
- **Security hygiene** (demonstrable, not production-grade): argon2 password
  hashing, Zod validation on every endpoint, role checks in middleware, rate
  limiting on auth routes, no committed secrets, `.env.example` provided.
- **Error handling:** consistent envelope `{ error: { code, message, details } }`;
  no stack traces to users; every list view has empty, loading (skeleton), and
  error states.

---

## 14. Build phases

**Stop and report after each phase.**

1. **Foundation** — monorepo, Docker Compose with PostGIS, Prisma schema,
   migrations, seed producing the full §11 dataset, health check.
   *Deliverable:* `npm run db:reset` works; data inspectable in Prisma Studio.
2. **API core** — auth (all three roles, incl. OTP + merchant registration),
   **the `clock` service (R2)**, shops, catalogue, geospatial search with
   ranking, confidence computation, order state machine, reviews, disputes.
   OpenAPI at `/docs/api.yaml`, Swagger UI at `/api/docs`. Integration tests
   covering **every state transition including illegal ones**, plus
   **role-enforcement and cross-tenant tests**.
3. **Customer app** — location selection, nearby-shop feed, search (single and
   multi-item), product detail with per-shop comparison, shop page, cart,
   reserve/order checkout, mock payment, live order tracking, pickup code,
   history, reviews, disputes.
4. **Merchant app** — **registration wizard (§5) and pending-approval screen**,
   login, dashboard, incoming-reservation screen with realtime alerts, inventory
   (bulk + barcode), profile and hours, order history, daily summary, language toggle.
5. **Admin panel + analytics** — approval queue, catalogue management with
   duplicate merge, order explorer, dispute resolution, analytics dashboard,
   ranking/decay controls.
6. **Demo mode, polish, documentation** — the `/demo` panel (§12),
   empty/loading/error states everywhere, PWA manifest, all §15 documents.

---

## 15. Documentation deliverables

In `/docs`, written **for an examiner, not a developer**. These are graded artefacts.

- `README.md` — one-paragraph pitch, screenshots, prerequisites, exact setup
  commands, demo credentials, troubleshooting.
- `architecture.md` — system diagram, component responsibilities, request
  lifecycle for a reservation, and the reasoning behind key decisions (why the
  global-catalogue/per-shop split, why confidence instead of counts, why PostGIS).
- `er-diagram.png` + source `.mmd`.
- `order-state-machine.png` + source.
- `api.yaml` — OpenAPI 3.
- `demo-script.md` — a scripted 8-minute walkthrough with exact clicks and
  expected outcomes, performable by one presenter, **with a fallback path for
  each step**.
- `future-scope.md` — honest limitations and what production would need (real
  payments, ONDC interoperability, delivery-partner network, POS integrations,
  fraud handling, unit economics, **and the mock-verification limitation from R11**).
- `viva-questions.md` — 25 likely examiner questions with concise answers,
  covering the data model, geospatial querying, the confidence algorithm,
  scalability, and how this differs from Blinkit / ONDC / magicpin.

---

## 16. Definition of done

On a clean machine with **no internet**:

- [ ] `docker compose up -d && npm install && npm run db:reset && npm run dev`
      brings up all three apps and the API.
- [ ] A customer searches "atta", sees **4+ nearby shops with differing
      availability badges and prices**, reserves from the nearest, and receives a
      pickup code.
- [ ] With auto-merchant off, the merchant app shows that reservation, and
      confirming it updates the customer's screen **in realtime without a refresh**.
- [ ] Marking an item unavailable flips that item's badge to "Out of stock" on
      the customer side and writes an `AvailabilityEvent`.
- [ ] Time-travelling 30 hours in the demo panel **visibly degrades** confidence badges.
- [ ] Multi-item search correctly identifies the single shop covering the most
      items from a 5-item list.
- [ ] The admin dashboard shows non-trivial charts and a zero-result search report.
- [ ] All three languages render correctly in the merchant app.
- [ ] `npm test` passes; **state machine tests reject illegal transitions**.
- [ ] A new shopkeeper completes the registration wizard end to end, lands on the
      pending-approval screen, and becomes fully functional the moment an admin
      approves them.
- [ ] A customer token is rejected with **`403`** on merchant endpoints, and
      **merchant A cannot read merchant B's orders**.
- [ ] All eight documents in §15 exist and are complete.
